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
import { BadRequestError, ForbiddenError, NotFoundError, RateLimitError, ServerError } from "../error";
import playlistService from "../services/playlist.service";
import { ParseJSON, ParseURLEncoded } from "../parsing.middleware";
import { CreatePlaylistValidator, DeletePlaylistValidator, PlaylistYTSearch } from "../validators/playlist.validator";
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

      if (data.playlist) {

        const returnData = {
          name: data.playlist.name,
          id: data.playlist.id,
          songCount: data.playlist.songs.length,
          isActive: data.playlist.isActive
        }

        res.status(200).json(returnData);

      }

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  // fetch logged in user playlists - GET "/_/playlists"
  api.get("/", ParseJSON, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      const data = await playlistService.fetchPlaylists(res.locals.user.id);

      res.status(200).json(data);

    } catch (err) {

      next(new ServerError());

    }

  });

  // delete playlist - DELETE "/_/playlists/:id"
  api.delete("/:id", ParseJSON, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {
    
    const {error} = DeletePlaylistValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const d = await playlistService.deletePlaylist(res.locals.user, req.params.id, req.body.password);

      if (d.error) {

        switch (d.error) {
          case "Playlist does not exist":
            return next(new NotFoundError("Playlist not found"));
          case "Access Denied":
            return next(new ForbiddenError());
        }

      } else {

        const data = await playlistService.fetchPlaylists(res.locals.user.id);

        res.status(200).json(data);

      }

    } catch (err) {

      next(new ServerError());

    }

  });

  // Delete song from playlist - DELETE "/_/:playlistid/songs/:songid"
  api.delete("/:playlistid/songs/:songid", auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {
    
    try {

      const d = await playlistService.deletePlaylistSong(res.locals.user.id, req.params.playlistid, req.params.songid);

      if (d.error) {

        switch (d.error) {
          case "Not Found Error":
            return next(new NotFoundError("Playlist not found."));
          case "Forbidden":
            return next(new ForbiddenError());
        }

      } else {

        res.status(200).json({statusCode:200,message:"OK"});

      }

    } catch (err) {

      next(new ServerError());

    }

  });

  // search youtube - GET "/_/playlists/search/yt"
  api.get("/search/yt", ParseURLEncoded, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = PlaylistYTSearch.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const d = await playlistService.YTSearch(req.body.q);

      res.status(200).json(d);

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  // add song to playlist - PUT "/_/playlists/:id/song/:cid"
  api.put("/:id/song/:cid", auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      const d = await playlistService.AddSongPlaylist(res.locals.user.id, req.params.id, req.params.cid);

      if (d.error) {

        switch (d.error) {

          case "Not found":
            return next(new NotFoundError("Playlist not found."));
          case "Forbidden":
            return next(new ForbiddenError())
          case "Maximum songs":
            return next(new RateLimitError("Maxiumum songs in a playlist reached"));
          case "Video does not exist":
            return next(new NotFoundError("Video not found."))

        }

      } else {

        res.status(200).json({statusCode: 200, message: "OK"});

      }

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  // fetch playlist songs - GET "/_/playlists/:id/songs/:page"
  api.get("/:id/songs/:page", auth, async (req, res, next) => {

    try {

      const data = await playlistService.fetchPlaylistSongs(req.params.id, res.locals.user.id, parseInt(req.params.page));

      if (data.error) {

        switch (data.error) {
          case "Playlist not found":
            return next(new NotFoundError("Playlist not found"));
          case "Forbidden":
           return next(new ForbiddenError())
        }

      } else {

        res.status(200).json(data.songs);

      }

    } catch (err) {
      next(new ServerError());
    }

  });

  // move song in playlist - PUT "/_/playlist/:id/:songid/move/:position"
  api.put("/:id/:songid/move/:position", auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {
    
    try {

      const d = await playlistService.movePlaylistSong(res.locals.user.id, req.params.id, req.params.songid, parseInt(req.params.position));

      if (d.error) {

        switch (d.error) {

          case "Playlist not found":
            return next(new NotFoundError("Playlist not found"));
          case "Foribdden":
            return next(new ForbiddenError());
          case "Internal Error":
            return next(new ServerError());

        }

      } else {

        res.status(200).json({statusCode:200,message:"OK"});

      }

    } catch (err) {

      throw err;

    }

  });

  // move song to top - PUT "/_/playlists/:id/:songid/move/top"
  api.put("/:id/:songid/movetop", auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      const d = await playlistService.movePlaylistSongToTop(res.locals.user.id, req.params.id, req.params.songid);

      if (d.error) {

        switch (d.error) {

          case "Playlist not found":
            return next(new NotFoundError("Playlist not found"));
          case "Foribdden":
            return next(new ForbiddenError());
          case "Internal Error":
            return next(new ServerError());

        }

      } else {

        res.status(200).json({statusCode:200,message:"OK"});

      }

    } catch (err) {

      console.log(err);

      throw err;

    }

  });

  return api;

};