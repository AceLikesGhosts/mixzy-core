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

import compression from "compression";
import express from "express";
import initdb from "./db";

import authController from "./controllers/auth.controller";

const router = express();

router.all('/*', (req:express.Request, res:express.Response, next:express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, PATCH");
  next();
});

const init = async () => {

  const redis = await initdb();

  router.use(express.json({
    limit: "100kb"
  }));

  router.use(compression({
    level: 2
  }));

  router.use("/auth", authController());

}

init();

export default router;