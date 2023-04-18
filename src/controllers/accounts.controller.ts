/*
  __  __           _                      _ 
 |  \/  |         (_)                    | |
 | \  / |_   _ ___ _  ___ _ __   __ _  __| |
 | |\/| | | | / __| |/ __| '_ \ / _` |/ _` |
 | |  | | |_| \__ \ | (__| |_) | (_| | (_| |
 |_|  |_|\__,_|___/_|\___| .__/ \__,_|\__,_|
                         | |                
                         |_|                

* Author: Jordan (LIFELINE) <hello@lifeline1337.dev>
* Copyright (C) 2023 LIFELINE
* Repo: https://github.com/musicpadnet/musicpad-core
* LICENSE: MIT <https://github.com/musicpadnet/musicpad-core/blob/main/LICENSE>
*/

import express from "express";
import { auth } from "../auth.middleware";
import { BadRequestError, RateLimitError, ServerError } from "../error";
import { changePasswordValidator, changeUsername, usernameLookupValidator } from "../validators/account.validator";
import accountService from "../services/account.service";
import { ParseJSON } from "../parsing.middleware";
import { Redis } from "ioredis";
import accountModel from "../models/account/account.model";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs";

export default (redis: Redis) => {

  const api = express.Router();

  // change username - PUT "/_/accounts/username"
  api.put("/username", ParseJSON, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = changeUsername.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const d = await accountService.changeUsername(redis, req.body.username, req.body.password, res.locals.user);

      if (d.error) {

        switch (d.error) {
          case "username taken":
            return next(new BadRequestError("Username is taken already"))
          case "invalid password":
            return next(new BadRequestError("Invalid password"));
          case "You can only change your username once every 30 days":
            return next(new RateLimitError("You can only change your username once every 30 days"));
        }

      } else {

        res.status(200).json({username: d.username});

      }

    } catch (err) {
      next(new ServerError());
    }

  });

  // change password - PUT "/_/accounts/password"
  api.put("/password", ParseJSON, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = changePasswordValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const d = await accountService.changePassword(req.body.current_password, req.body.new_password, res.locals.user);

      if (d.error) return next(new BadRequestError("Invalid password"));

      res.status(200).json(d.tokens);

    } catch (err) {
      next(new ServerError());
    }

  });

  // check username - GET "/_/accounts/check/:username"
  api.get("/check/:username", async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = usernameLookupValidator.validate(req.params);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const usernameExists = await accountModel.findOne({username: req.params.username});

      if (usernameExists) return next(new BadRequestError("username taken"));

      res.status(200).json({statusCode:200,username:req.params.username});

    } catch (err) {
      next(new ServerError());
    }

  });

  // upload profile pic - post "/_/accounts/pfp"
  api.post("/pfp", auth, accountService.avatarUpload, (req:express.Request, res:express.Response, next:express.NextFunction) => {

    redis.get(`${res.locals.user.id}:pic:timeout`).then(data => {

      if (!data) {

        let count = 1;

        redis.set(`${res.locals.user.id}:pic:timeout`, count.toString(), "EX", (60*30)).then().catch();

        // boopss
        const image = sharp(req.file?.path);

        image.metadata().then(async (metadata) => { // get image metadata for size
      
          if (!metadata || !metadata.width || !metadata.height) return next(new ServerError());

          let data: Buffer;

          if (metadata.width > 300 || metadata.height > 300) {

            data = await image.webp({quality: 70}).resize(300, 300).toBuffer();

          } else {

            data = await image.webp({quality: 70}).toBuffer();

          }

          if (!req.file) return next(new ServerError());

          // remove file from local storage cause we have the buffer
          fs.rmSync(req.file.path, {force: true});

          let params = {
            Key: req.res?.locals.webp,
            Body: data,
            Bucket: "mixtrack",
            ACL: "public-read",
            ContentType: "image/webp"
          }

          accountService.S3.send(new PutObjectCommand(params));

          if (!res.locals.user.profile_image || res.locals.user.profile_image === null) {

            accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: req.res?.locals.web}}).then(() => {
  
              res.status(200).json({image: req.res?.locals.webp});
  
            }).catch(err => {
  
              next(new ServerError());
  
            });
  
          } else {
  
            let params = {
              Bucket: 'mixtrack',
              Key: res.locals.user.profile_image
            }
    
            accountService.S3.send(new DeleteObjectCommand(params)).then(() => {
    
              accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: req.res?.locals.webp}}).then(() => {
  
                res.status(200).json({image: req.res?.locals.webp});
  
              }).catch(err => {
  
                next(new ServerError());
  
              });
    
            }).catch((err) => {
  
              console.log(err);
  
              next(new ServerError());
  
            });
  
          }

        }).catch(err => {
          next(new ServerError());
        });

      } else {

        let p = parseInt(data);

        if (p >= 3) {

          if (!req.file) return next(new ServerError());

          fs.rmSync(req.file.path, {force: true});

          next(new RateLimitError("You're changing your profile pic too fast"));

        } else {

          // yert berp the the jet

          p++;

          redis.set(`${res.locals.user.id}:pic:timeout`, p.toString(), "EX", (60*30)).then().catch();

          const image = sharp(req.file?.path);

          image.metadata().then(async (metadata) => { // get image metadata for size
      
            if (!metadata || !metadata.width || !metadata.height) return next(new ServerError());

            let data: Buffer;

            if (metadata.width > 300 || metadata.height > 300) {

              data = await image.webp({quality: 80}).resize(300, 300).toBuffer();

            } else {

              data = await image.webp({quality: 80}).toBuffer();

            }

            if (!req.file) return next(new ServerError());

            // remove file from local storage cause we have the buffer
            fs.rmSync(req.file.path, {force: true});

            let params = {
              Key: req.res?.locals.webp,
              Body: data,
              Bucket: "mixtrack",
              ACL: "public-read",
              ContentType: "image/webp"
            }

            accountService.S3.send(new PutObjectCommand(params));

            if (!res.locals.user.profile_image || res.locals.user.profile_image === null) {

              accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: req.res?.locals.web}}).then(() => {
  
                res.status(200).json({image: req.res?.locals.webp});
  
              }).catch(err => {
  
                next(new ServerError());
  
              });
  
            } else {
  
              let params = {
                Bucket: 'mixtrack',
                Key: res.locals.user.profile_image
              }
    
              accountService.S3.send(new DeleteObjectCommand(params)).then(() => {
    
                accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: req.res?.locals.webp}}).then(() => {
  
                  res.status(200).json({image: req.res?.locals.webp});
  
                }).catch(err => {
  
                  next(new ServerError());
  
                });
    
              }).catch((err) => {
  
                console.log(err);
  
                next(new ServerError());
  
              });
  
            }

          }).catch(err => {
            next(new ServerError());
          });

        }

      }

    }).catch(err => {

      next(new ServerError());

    });

  });

  // Get current logged in user - GET "/_/accounts/@me"
  api.get("/@me", auth, ParseJSON, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      const d = await accountService.fetchLoggedinAccount(res.locals.user.id);

      res.status(200).json(d);

    } catch (err) {

      next(new ServerError());

    }

  });

  return api;

}