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

import http from "http";
import express from "express";
import { ApiError, NotFoundError } from "./error";

import config from "config";
import routes from "./routes";

const app = express();
const server = http.createServer(app);

app.get("/_", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, PATCH");

  res.status(200).json({statusCode:200,message:"OK"});

});

app.use("/_", routes);

app.all("*", (req:express.Request, res:express.Response, next:express.NextFunction) => {
  next(new NotFoundError("Endpoint not found."));
});

// error handler
app.use((err: ApiError, req:express.Request, res:express.Response, next:express.NextFunction) => {
  res.status(err.code).json({
    statusCode: err.code,
    error: err.error,
    message: err.message
  });
});

server.listen(config.get("port"), () => console.error(`Restful API now running on port ${config.get("port")}`));

export default app;