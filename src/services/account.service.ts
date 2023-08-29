import argon2 from "argon2";
import Redis from "ioredis";
import accountModel from "../models/account/account.model";
import IAccount from "../models/account/account.type";
import authService from "./auth.service";
import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import config from "config";
import _ from "lodash";
import speakeasy from "speakeasy";

class AccountService {

  S3 = new S3Client({
    credentials: {
      accessKeyId: config.get("s3.accessKey"),
      secretAccessKey: config.get("s3.accessSecret")
    },
    endpoint: config.get("s3.endpoint"),
    region: config.get("s3.region")
  });

  // gen pfp HMAC
  genPfpHMAC (): string {

    const payload = {
      time: Date.now(),
      random: crypto.randomBytes(20).toString("hex")
    }
    
    const hmac = crypto.createHmac("sha1", crypto.randomBytes(20).toString("hex")).update(payload.toString()).digest("hex");

    return hmac;

  }

  // avatar upload
  avatarUpload = multer({
    limits: {fileSize: 5242880},
    fileFilter: (req, file, cb) => {

      if (file.size > 5242880) return cb(new Error("File size limit is 5MB"));
      
      if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        cb(null, true);
      } else {
        return cb(new Error("Only .png, .jpg and .jpeg format allowed!"))
      }

    },
    storage: multer.diskStorage({
      destination: "/tmp", // store in local storage file system
      filename: async (req, file, cb) => {

        let key = this.genPfpHMAC();

        switch (file.mimetype) {
          case "image/jpg":
            return cb(null, `${key}.jpg`);
          case "image/jpeg":
            return cb(null, `${key}.jpeg`);
          case "image/png":
            return cb(null, `${key}.png`)
        }

      },
    })
  }).single("avatar");

  // change username service method
  async changeUsername (redis: Redis, username:string, password:string, code: string, user: IAccount): Promise<{error?: string, username?:string}> {

    try {

      const usernameTaken = await accountModel.findOne({username});

      if (usernameTaken) return {error: "username taken"};

      const timeout = await redis.get(`${user.id}:username:timeout`);

      if (timeout) {

        return {error: "You can only change your username once every 30 days"};

      } else {

        if (user.two_factor === true && !code) {

          return {error: "two_factor_enabled"};

        } else if (user.two_factor === true && code) {

          const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: "base32",
            token: code,
            window: 6
          });

          if (!verified) return {error: "invalid code"};

          await accountModel.updateOne({_id: user.id}, {username: username});

          let dt = new Date();
          dt.setSeconds(dt.getSeconds() + (60*60*24*30));

          await redis.set(`${user.id}:username:timeout`, "true", "EX", (60*60*24*30));

          return {username: username};

        } else if (user.two_factor === false && !password) {

          return {error: "invalid password"};

        } else {

          if (await argon2.verify(user.hash, password) !== true) return {error: "invalid password"};

          await accountModel.updateOne({_id: user.id}, {username: username});

          let dt = new Date();
          dt.setSeconds(dt.getSeconds() + (60*60*24*30));

          await redis.set(`${user.id}:username:timeout`, "true", "EX", (60*60*24*30));

          return {username: username};

        }

      }

    } catch (err) {
      throw err;
    }

  }

  // change password service method
  async changePassword (current_password: string, new_password: string, code: string, user: IAccount): Promise<{error?: string, tokens?: {access_token: string, refresh_token: string, expires: number}}> {

    try {

      if (await argon2.verify(user.hash, current_password) !== true) return {error: "Invalid password"};

      if (user.two_factor === true && !code) {

        return {error: "two_factor_enabled"};

      } else if (user.two_factor === true && code) {

        const verified = speakeasy.totp.verify({
          secret: user.two_factor_secret,
          encoding: "base32",
          token: code,
          window: 6
        });

        if (!verified) return {error: "invalid 2fa code"};

        const hash = await argon2.hash(new_password, {saltLength: 70, type: argon2.argon2id});

        await accountModel.updateOne({_id: user.id}, {hash});

        await authService.revokeUserTokens(user.id);

        const tokens = await authService.genTokens(user.id);

        return {tokens: tokens};

      } else {

        const hash = await argon2.hash(new_password, {saltLength: 70, type: argon2.argon2id});

        await accountModel.updateOne({_id: user.id}, {hash});

        await authService.revokeUserTokens(user.id);

        const tokens = await authService.genTokens(user.id);

        return {tokens: tokens};

      }

    } catch (err) {
      throw err;
    }

  }

  // fetch logged in user object
  async fetchLoggedinAccount (userid: string): Promise<any> {

    try {

      const account = await accountModel.findOne({_id: userid});

      if (!account) throw "Interanl Server Error";

      const r = _.pick(account, ["id", "username", "profile_image"]);

      return r;

    } catch (err) {

      throw err;

    }

  }

}

export default new AccountService();