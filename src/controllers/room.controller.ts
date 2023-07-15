import express from "express";
import { Redis } from "ioredis";
import _ from "lodash";
import { auth } from "../auth.middleware";
import { BadRequestError, ForbiddenError, NotFoundError, RateLimitError, ServerError } from "../error";
import { ParseJSON } from "../parsing.middleware";
import roomService from "../services/room.service";
import { createRoomValidator, updateDescriptionValidator, updateWelcomeMessageValidator } from "../validators/room.validator";
import roomModel from "../models/room/room.model";
import sharp from "sharp";
import fs from "fs";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "config";

let bucket: any = config.get("s3.bucket");

export default (redis: Redis) => {

  const api = express.Router();

  // create room - POST "/_/rooms/create"
  api.post("/create", auth, ParseJSON, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = createRoomValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const d = await roomService.createRoom(redis, req.body.name, req.body.slug, res.locals.user.id);

      if (d.error) {

        switch (d.error) {

          case "Slug already taken":
            return next(new BadRequestError("Slug is taken"));
          case "room ratelimit":
            return next(new RateLimitError("You can only have 3 rooms"));

        }

      }

      res.status(200).json({statusCode:200,message:"OK",slug:req.body.slug});

    } catch (err) {

      next(new ServerError());

    }

  });

  // list rooms by popular - GET "/_/rooms"
  api.get("/:page", ParseJSON, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      if (!req.params.page) return next(new BadRequestError("Invalid page number"));

      const page = parseInt(req.params.page);

      const rooms = await roomService.fetchPopularRooms(redis);

      const paginatedRooms = await roomService.paginateRooms(rooms, 20, page);

      res.status(200).json({next: paginatedRooms.next, prev: paginatedRooms.prev, totalPages: paginatedRooms.totalPages, items: paginatedRooms.items});

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  // update room description - PATCH "/_/rooms/:id/description"
  api.patch("/:id/description", auth, ParseJSON, async (req, res, next) => {

    try {

      const {error} = updateDescriptionValidator.validate(req.body);

      if (error) return next(new BadRequestError(error.details[0].message));

      const d = await roomService.updateDescription(req.params.id, res.locals.user.id, req.body.description);

      if (d.error) {
        
        if (d.error === "invalid room id") {
          return next(new BadRequestError("Invalid room id"));
        } else if (d.error === "forbidden") {
          return next(new ForbiddenError("Access Denied"));
        }

      } else {

        res.status(200).json({description: d.desc});

      }

    } catch (err) {

      next(new ServerError());

    }

  });

  // update room welcome message - PATCH "/_/rooms/:id/message"
  api.patch("/:id/message", auth, ParseJSON, async (req, res, next) => {

    try {

      const {error} = updateWelcomeMessageValidator.validate(req.body);

      if (error) return next(new BadRequestError(error.details[0].message));

      const d = await roomService.updateRoomWelcomeMessage(req.params.id, res.locals.user.id, req.body.message);

      if (d.error === "invalid room id") {
        return next(new BadRequestError("Invalid room id"));
      } else if (d.error === "forbidden") {
        return next(new ForbiddenError("Access Denied"));
      }

      res.status(200).json({message: d.message});

    } catch (err) {

      next(new ServerError());

    }

  });

  // fetch specific room - GET "/_/rooms/@:slug"
  api.get("/@/:slug", async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      const room = await roomModel.findOne({slug: req.params.slug}).populate("owner").populate("queue_history.played_by").exec();

      if (!room) return next(new NotFoundError("Room not found"));

      const rRoom = await redis.get(`rooms:${room.id}`);

      if (!rRoom) return next(new NotFoundError("Room not found"));

      const parsedRoom = JSON.parse(rRoom);

      const rQueue_History = room.queue_history?.map(obj => {

        return {
          played_by: {
            id: obj.played_by.id,
            username: obj.played_by.username
          },
          title: obj.title,
          cid: obj.cid,
          thumbnail: obj.thumbnail,
          duration: obj.duration,
          upvotes: obj.upvotes,
          grabs: obj.grabs,
          downvotes: obj.downvotes,
          timestamp: obj.timestamp
        }

      });

      room.queue_history = rQueue_History;

      let combine = {
        name: room.name,
        slug: room.slug,
        id: room.id,
        current_dj: parsedRoom.current_dj,
        users: parsedRoom.users,
        waitlist: parsedRoom.waitlist,
        background: room.background,
        description: room.description,
        welcome_message: room.welcome_message,
        queue_cycle: room.queue_cycle,
        queue_locked: room.queue_locked,
        queue_history: room.queue_history,
        owner: {
          id: room.owner?.id,
          username: room.owner?.username,
          pfp: room.owner?.profile_image
        }
      }

      const actualRoom = _.pick(combine, ["id", "slug", "current_dj", "welcome_message", "description", "name", "users", "queue_cycle", "queue_locked", "queue_history", "waitlist", "background", "owner"]);

      res.status(200).json(actualRoom);

    } catch (err) {

      next(new ServerError());

    }

  });

  // upload room background
  api.post("/:id/background", auth, roomService.backgroundUpload, (req:express.Request, res:express.Response, next: express.NextFunction) => {

    if (!req.params.id) return next(new BadRequestError("Invalid room id"));

    roomModel.findOne({_id: req.params.id}).populate("owner").exec().then((room) => {

      if (!room) return next(new BadRequestError("Invalid room id"));

      if (room.owner?.id !== res.locals.user.id) return next(new  ForbiddenError("Access Denied"));

      redis.get(`${room.id}:bg:timeout`).then(data => {

        if (!data) {
  
          let count = 1;
  
          redis.set(`${room.id}:bg:timeout`, count.toString(), "EX", (60*30)).then().catch();
  
          // boopss
          const image = sharp(req.file?.path);
  
          image.metadata().then(async (metadata) => { // get image metadata for size
        
            if (!metadata || !metadata.width || !metadata.height) return next(new ServerError());
  
            let data: Buffer;
  
            if (metadata.width > 1920 || metadata.height > 1080) {
  
              data = await image.webp({quality: 100}).resize(1920, 1080).toBuffer();
  
            } else {
  
              data = await image.webp({quality: 100}).toBuffer();
  
            }
  
            if (!req.file) return next(new ServerError());
  
            // remove file from local storage cause we have the buffer
            fs.rmSync(req.file.path, {force: true});
  
            let filekey = req.file.filename.split(".")[0];
  
            let actualKey = `_backgrounds/${room.id}/${filekey}.webp`;
  
            let params = {
              Key: actualKey,
              Body: data,
              Bucket: bucket,
              ACL: "public-read",
              ContentType: "image/webp"
            }
  
            roomService.S3.send(new PutObjectCommand(params));
  
            if (!room.background || room.background === null) {
  
              roomModel.updateOne({_id: room.id}, {$set: {background: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {
  
                res.status(200).json({image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey});
    
              }).catch(err => {
    
                console.log(err);
  
                next(new ServerError());
    
              });
    
            } else {
    
              let params = {
                Bucket: bucket,
                Key: room.background.replace("https://sjc1.vultrobjects.com/mixzy/", "")
              }
      
              roomService.S3.send(new DeleteObjectCommand(params)).then(() => {
      
                roomModel.updateOne({_id: room.id}, {$set: {background: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {
  
                  console.log("does save");
  
                  res.status(200).json({image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey});
    
                }).catch(err => {
    
                  console.log(err);
  
                  next(new ServerError());
    
                });
      
              }).catch((err) => {
    
                console.log(err);
    
                next(new ServerError());
    
              });
    
            }
  
          }).catch(err => {
  
            console.log(err);
  
            next(new ServerError());
          });
  
        } else {
  
          let p = parseInt(data);
  
          if (p >= 4) {
  
            if (!req.file) return next(new ServerError());
  
            fs.rmSync(req.file.path, {force: true});
  
            next(new RateLimitError("You're changing room backgrounds too fast"));
  
          } else {
  
            p++;
  
            redis.set(`${room.id}:bg:timeout`, p.toString(), "EX", (60*30)).then().catch();
  
            const image = sharp(req.file?.path);
  
            image.metadata().then(async (metadata) => { // get image metadata for size
        
              if (!metadata || !metadata.width || !metadata.height) return next(new ServerError());
  
              let data: Buffer;
  
              if (metadata.width > 1920 || metadata.height > 1080) {
  
                data = await image.webp({quality: 100}).resize(1920, 1080).toBuffer();
    
              } else {
    
                data = await image.webp({quality: 100}).toBuffer();
    
              }
  
              if (!req.file) return next(new ServerError());
  
              // remove file from local storage cause we have the buffer
              fs.rmSync(req.file.path, {force: true});
  
              let filekey = req.file.filename.split(".")[0];
  
              let actualKey = `_backgrounds/${res.locals.user.id}/${filekey}.webp`;
  
              console.log(actualKey);
  
              let params = {
                Key: actualKey,
                Body: data,
                Bucket: bucket,
                ACL: "public-read",
                ContentType: "image/webp"
              }
  
              roomService.S3.send(new PutObjectCommand(params));
  
              if (!room.background || room.background === null) {
  
                roomModel.updateOne({_id: room.id}, {$set: {background: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {
  
                  res.status(200).json({image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey});
    
                }).catch(err => {
  
                  console.log(err);
    
                  next(new ServerError());
    
                });
    
              } else {
    
                let params = {
                  Bucket: bucket,
                  Key: room.background.replace("https://sjc1.vultrobjects.com/mixzy/", "")
                }
  
                console.log(params.Key);
      
                roomService.S3.send(new DeleteObjectCommand(params)).then(() => {
      
                  roomModel.updateOne({_id: room.id}, {$set: {background: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {
                  
                    res.status(200).json({image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey});
    
                  }).catch(err => {
    
                    console.log(err);
  
                    next(new ServerError());
    
                  });
      
                }).catch((err) => {
    
                  console.log(err);
    
                  next(new ServerError());
    
                });
    
              }
  
            }).catch(err => {
              console.log(err);
  
              next(new ServerError());
            });
  
          }
  
        }
  
      }).catch(err => {
  
        console.log(err);
  
        next(new ServerError());
  
      });

    }).catch(err => {

      next(new ServerError());

    });

  });

  return api;

}