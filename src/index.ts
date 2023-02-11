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

import http from "http";
import express from "express";
import { ApiError, NotFoundError } from "./error";

import config from "config";
import routes from "./routes";

const app = express();
const server = http.createServer(app);

app.get("/", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET");

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