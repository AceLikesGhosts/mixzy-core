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
import { auth } from "../auth.middleware";
import { BadRequestError, RateLimitError, ServerError } from "../error";
import playlistService from "../services/playlist.service";
import { ParseJSON } from "../parsing.middleware";
import { CreatePlaylistValidator } from "../validators/playlist.validator";
import _ from "lodash";

export default () => {

  const api = express.Router();

  // create playlist - POST "/_/playlists"
  api.post("/", ParseJSON, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = CreatePlaylistValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const data = await playlistService.createPlaylist(res.locals.user.id, req.body.name);

      if (data.error) return next(new RateLimitError("You can only have 5 playlists"));

      res.status(200).json(data.playlist);

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  return api;

};