/*


  __  __ _   _______             _    
 |  \/  (_) |__   __|           | |   
 | \  / |___  _| |_ __ __ _  ___| | __
 | |\/| | \ \/ / | '__/ _` |/ __| |/ /
 | |  | | |>  <| | | | (_| | (__|   < 
 |_|  |_|_/_/\_\_|_|  \__,_|\___|_|\_\
                                      
* Author: Jordan (LIFELINE) <hello@lifeline1337.dev>
* Copyright (C) 2023 LIFELINE
* Repo: https://github.com/lifeline1337/mixtrack-restful
* LICENSE: MIT <https://github.com/lifeline1337/mixtrack-restful/blob/main/LICENSE>
*/

import jwt from "jsonwebtoken";
import config from "config";
import argon2 from "argon2";
import accessTokenModel from "../models/access_token/access_token.model";
import refreshTokenModel from "../models/refresh_token/refresh_token.model";
import accountModel from "../models/account/account.model";

class AuthService {

  async genTokens (userid: string): Promise<{access_token: string, refresh_token: string, expires: number}> {
    
    try {

      const access_token = jwt.sign({
        user: userid
      }, config.get("access_secret"), {
        expiresIn: (60*60*7)
      });

      const newAccessToken = new accessTokenModel({
        access_token,
        user: userid
      });

      await newAccessToken.save();

      const refresh_token = jwt.sign({
        user: userid
      }, config.get("refresh_secret"), {
        expiresIn: (60*60*24*7)
      });

      const newRefreshToken = new refreshTokenModel({
        access_token: access_token,
        refresh_token: refresh_token,
        user: userid
      });

      await newRefreshToken.save();

      let dt = new Date();
      dt.setSeconds(dt.getSeconds() + ((60*60*7) - 1));

      return {
        access_token,
        refresh_token,
        expires: dt.getTime()
      }

    } catch (err) {

      throw err;

    }

  }

  // to do simple function for creating account
  async createAccount (email: string, username: string, password: string): Promise<{error?: string, data?: {access_token: string, refresh_token: string, expires: number}}> {
    
    try {

      const emailExists = await accountModel.findOne({email});

      if (emailExists) return {error: "Email already registered"};

      const usernameExists = await accessTokenModel.findOne({username});

      if (usernameExists) return {error: "Username already taken"};

      const hash = await argon2.hash(password, {type: argon2.argon2id, saltLength: 70});

      const newAccount = new accountModel({
        email: email,
        username: username,
        hash: hash
      });

      const savedAccount = await newAccount.save();

      const tokens = await this.genTokens(savedAccount._id);

      return {data: tokens};

    } catch (err) {

      throw err;

    }

  }

  // revoke users tokens
  async revokeUserTokens (userid: string) {

    try {

      await accessTokenModel.deleteMany({user: userid});

      await refreshTokenModel.deleteMany({user: userid});

    } catch (err) {

      throw err;

    }

  }

}

export default new AuthService();