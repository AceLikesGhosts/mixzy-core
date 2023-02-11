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

import express from "express";
import { BadRequestError, ServerError } from "../error";
import { loginValidator, registerValidator } from "../validators/auth.validator";
import authService from "../services/auth.service";
import accountModel from "../models/account/account.model";
import argon2 from "argon2";

export default () => {

  const api = express.Router();

  // create account - POST "/_/auth/register"
  api.post("/register", async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = registerValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const data = await authService.createAccount(req.body.email, req.body.username, req.body.password);

      if (data.error) {

        // handle errors
        switch (data.error) {

          case "Email already registered":
            return next(new BadRequestError("Email already registered"));
          case "Username already taken":
            return next(new BadRequestError("Username already taken"));

        }

      } else {

        res.status(200).json(data.data);

      }

    } catch (err) {

      next(new ServerError());

    }

  });

  // login - POST "/_/auth/login"
  api.post("/login", async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = loginValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const account = await accountModel.findOne({email: req.body.email});

      if (!account) return next(new BadRequestError("Invalid email or password"));

      if (await argon2.verify(account.hash, req.body.password) !== true) return next(new BadRequestError("Invalid email or password"));

      const tokens = await authService.genTokens(account.id);

      res.status(200).json(tokens);

    } catch (err) {

      next(new ServerError());

    }

  });

  return api;

}