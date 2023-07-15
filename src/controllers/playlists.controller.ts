import express from "express";
import { auth } from "../auth.middleware";
import { BadRequestError, ForbiddenError, NotFoundError, RateLimitError, ServerError } from "../error";
import playlistService from "../services/playlist.service";
import { ParseJSON, ParseURLEncoded } from "../parsing.middleware";
import { CreatePlaylistValidator, DeletePlaylistValidator, ImportPlaylistValidator, PlaylistYTSearch, RenamePlaylistValidator } from "../validators/playlist.validator";
import _ from "lodash";
import playlistModel from "../models/playlist/playlist.model";

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
          case "Invalid password":
            return next(new BadRequestError("Invalid password"))
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
  api.get("/search/yt", ParseJSON, auth, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    if (!req.query.q) return next(new BadRequestError("Invalid Query"))

    try {

      // @ts-ignore
      const d = await playlistService.YTSearch(req.query.q);

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

        const playlist = await playlistModel.findOne({_id: req.params.id});

        if (!playlist) return next(new BadRequestError("Invalid id"));

        const index = 0;

        res.status(200).json({song: playlist.songs[index]});

      }

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  // fetch playlist songs - GET "/_/playlists/:id/songs/:page"
  api.get("/:id/songs", auth, async (req, res, next) => {

    try {

      const data: {error?: string, songs?: any[]} = await playlistService.fetchPlaylistSongs(req.params.id, res.locals.user.id, parseInt(req.params.page));

      if (data.error) {

        switch (data.error) {
          case "Playlist not found":
            return next(new NotFoundError("Playlist not found"));
          case "Forbidden":
           return next(new ForbiddenError())
        }

      } else {

        res.status(200).json(data);

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

  // activate playlist - PATCH "/_/playlists/activate/:id"
  api.patch("/activate/:id", auth, async (req, res, next) => {

    if (!req.params.id) return next(new BadRequestError("Invlaid playlist id"));

    try {

      const d = await playlistService.activatePlaylist(req.params.id, res.locals.user.id);

      if (d.error) {

        switch (d.error) {

          case "Invalid playlist":
            return next(new BadRequestError("Invalid playlist"));
          case "Forbidden":
            return next(new ForbiddenError());
          case "Already active":
            return next(new BadRequestError("Already active"));

        }

      }

      res.status(200).json({"statusCode":200,"message":"OK"});

    } catch (err) {

      next(new ServerError());

    }
  
  });

  // rename playlist - PATCH "/_/playlists/:id/rename"
  api.patch("/:id/rename", auth, ParseJSON, async (req, res, next) => {

    const {error} = RenamePlaylistValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    if (!req.params.id) return next(new BadRequestError("Invalid playlist"));

    try {

      const d = await playlistService.renamePlaylist(req.body.name, req.params.id, res.locals.user.id);

      if (d.error) {

        switch (d.error) {

          case "Invalid playlist":
            return next(new BadRequestError("Invalid playlist"));
          case "Forbidden":
            return next(new ForbiddenError());

        }

      }

      res.status(200).json({statusCode:200,message:"OK"});

    } catch (err) {
      next(new ServerError());
    }

  });

  // import playlist - POST "/_/playlists/import/:id"
  api.post("/import/:id", auth, ParseJSON, async (req, res, next) => {

    const {error} = ImportPlaylistValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    if (!req.params.id) return next(new BadRequestError("Invalid playlist"));

    try {

      const d = await playlistService.importPlaylist(req.params.id, req.body.name, res.locals.user.id);

      res.status(200).json(d.playlist);

    } catch (err) {

      if (err === "playlist does not exist") {

        next(new BadRequestError("Invalid playlist id"));

      } else if (err === "you can only have 5 playlists") {

        next(new BadRequestError("you can only have 5 playlists"));

      } else {

        next(new ServerError());

      }
    }

  });


  // shuffle playlist - PUT "/_/playlists/:id/shuffle"
  api.put("/:id/shuffle", auth, ParseJSON, async (req, res, next) => {

    try {

      const playlist = await playlistModel.findOne({_id: req.params.id}).populate("owner").exec();

      if (!playlist) return next(new BadRequestError("Invalid Playlist"));

      if (res.locals.user.id !== playlist.owner.id) return next(new ForbiddenError("Access Denied"));

      let playlistSongsShuffled = _.shuffle(playlist.songs);

      playlist.songs = playlistSongsShuffled;

      await playlist.save();

      const playlists = await playlistModel.find({owner: res.locals.user.id});

      res.status(200).json({playlists});

    } catch (err) {

      next(new ServerError());

    }

  });

  return api;

};