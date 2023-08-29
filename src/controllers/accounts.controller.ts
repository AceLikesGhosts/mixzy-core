import express from "express";
import { auth } from "../auth.middleware";
import { BadRequestError, RateLimitError, ServerError } from "../error";
import { changePasswordValidator, changeUsername, usernameLookupValidator, verify2FaValidator } from "../validators/account.validator";
import accountService from "../services/account.service";
import { ParseJSON } from "../parsing.middleware";
import { Redis } from "ioredis";
import accountModel from "../models/account/account.model";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs";
import config from "config";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

let bucket: any = config.get("s3.bucket");

export default (redis: Redis) => {

  const api = express.Router();

  // change username - PUT "/_/accounts/username"
  api.put("/username", ParseJSON, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = changeUsername.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const d = await accountService.changeUsername(redis, req.body.username, req.body.password, req.body.code, res.locals.user);

      if (d.error) {

        switch (d.error) {
          case "username taken":
            return next(new BadRequestError("Username is taken already"))
          case "invalid password":
            return next(new BadRequestError("Invalid password"));
          case "You can only change your username once every 30 days":
            return next(new RateLimitError("You can only change your username once every 30 days"));
          case "two_factor_enabled":
            return res.status(202).json({"message": "two factor enabled"});
          case "invalid code":
            return next(new BadRequestError("Invalid Code"));
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

      const d = await accountService.changePassword(req.body.current_password, req.body.new_password, req.body.code, res.locals.user);

      if (d.error) {

        switch (d.error) {

          case "Invalid password":

            next(new BadRequestError("invalid password"));
            
          break;

          case "two_factor_enabled":
            
            res.status(202).json({message: "two factor enabled"});

          break;

          case "invalid 2fa code":

            next(new BadRequestError("invalid code"));

          break;

        }

      } else {

        res.status(200).json(d.tokens);

      }

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

          console.log(req.file);

          if (!req.file) return next(new ServerError());

          // remove file from local storage cause we have the buffer
          fs.rmSync(req.file.path, {force: true});

          let filekey = req.file.filename.split(".")[0];

          let actualKey = `_avatars/${res.locals.user.id}/${filekey}.webp`;

          let params = {
            Key: actualKey,
            Body: data,
            Bucket: bucket,
            ACL: "public-read",
            ContentType: "image/webp"
          }

          accountService.S3.send(new PutObjectCommand(params));

          if (!res.locals.user.profile_image || res.locals.user.profile_image === null) {

            accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {

              res.status(200).json({image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey});
  
            }).catch(err => {
  
              console.log(err);

              next(new ServerError());
  
            });
  
          } else {
  
            let params = {
              Bucket: bucket,
              Key: res.locals.user.profile_image.replace("https://sjc1.vultrobjects.com/mixzy/", "")
            }
    
            accountService.S3.send(new DeleteObjectCommand(params)).then(() => {
    
              accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {

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

          next(new RateLimitError("You're changing your profile pic too fast"));

        } else {

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

            let filekey = req.file.filename.split(".")[0];

            let actualKey = `_avatars/${res.locals.user.id}/${filekey}.webp`;

            console.log(actualKey);

            let params = {
              Key: actualKey,
              Body: data,
              Bucket: bucket,
              ACL: "public-read",
              ContentType: "image/webp"
            }

            accountService.S3.send(new PutObjectCommand(params));

            if (!res.locals.user.profile_image || res.locals.user.profile_image === null) {

              accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {

                res.status(200).json({image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey});
  
              }).catch(err => {

                console.log(err);
  
                next(new ServerError());
  
              });
  
            } else {
  
              let params = {
                Bucket: bucket,
                Key: res.locals.user.profile_image.replace("https://sjc1.vultrobjects.com/mixzy/", "")
              }

              console.log(params.Key);
    
              accountService.S3.send(new DeleteObjectCommand(params)).then(() => {
    
                accountModel.updateOne({_id: res.locals.user.id}, {$set: {profile_image: "https://sjc1.vultrobjects.com/mixzy/" + actualKey}}).then(() => {
                
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

  // gen 2fa secret - POST "/_/accounts/2fa/gen"
  api.post("/2fa/gen", auth, async (req, res, next) => {

    try {

      if (res.locals.user.two_factor === true) return next(new BadRequestError("Two Factor is already active"));

      const temp_secret = speakeasy.generateSecret({length: 32});

      await accountModel.updateOne({_id: res.locals.user.id}, {$set: {two_factor_secret: temp_secret.base32}});

      temp_secret.otpauth_url

      // @ts-ignore
      QRCode.toDataURL(temp_secret.otpauth_url, (err, data_url) => {

        if (err) return next(new ServerError());

        res.status(200).json({secret: temp_secret.base32, qrCode: data_url});

      });

    } catch (err) {

      next(new ServerError());

    }

  });

  // verify and enable 2fa - POST "/_/accounts/2fa/verify"
  api.post("/2fa/verify", auth, ParseJSON, async (req, res, next) => {

    const {error} = verify2FaValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const verified = speakeasy.totp.verify({
        secret: res.locals.user.two_factor_secret,
        encoding: "base32",
        token: req.body.code,
        window: 6
      });

      if (!verified) next(new BadRequestError("Invalid Code"));

      await accountModel.updateOne({_id: res.locals.user.id}, {$set: {two_factor: true}});

      res.status(200).json({message: "two factor now enabled"});

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  return api;

}