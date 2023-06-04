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

import compression from "compression";
import express from "express";
import initdb from "./db";

import authController from "./controllers/auth.controller";
import playlistsController from "./controllers/playlists.controller";
import accountsController from "./controllers/accounts.controller";
import roomController from "./controllers/room.controller";

const router = express();

router.all('/*', (req:express.Request, res:express.Response, next:express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, PATCH, OPTIONS");
  next();
});

const init = async () => {

  const redis = await initdb();

  router.use(compression({
    level: 2
  }));

  router.use("/auth", authController());
  router.use("/playlists", playlistsController());
  router.use("/accounts", accountsController(redis));
  router.use("/rooms", roomController(redis));

}

init();

export default router;