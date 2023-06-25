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