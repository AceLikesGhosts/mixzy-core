import express from "express";
import { Redis } from "ioredis";
import _ from "lodash";
import { auth } from "../auth.middleware";
import { BadRequestError, NotFoundError, RateLimitError, ServerError } from "../error";
import { ParseJSON } from "../parsing.middleware";
import roomService from "../services/room.service";
import { createRoomValidator } from "../validators/room.validator";
import roomModel from "../models/room/room.model";

export default (redis: Redis) => {

  const api = express.Router();

  // create room - POST "/_/rooms/create"
  api.post("/create", auth, ParseJSON, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    const {error} = createRoomValidator.validate(req.body);

    if (error) return next(new BadRequestError(error.details[0].message));

    try {

      const d = await roomService.createRoom(redis, req.body.name, req.body.slug, res.locals.user.id);

      if (d.error) {

        switch (d.error) {

          case "Slug already taken":
            return next(new BadRequestError("Slug is taken"));
          case "room ratelimit":
            return next(new RateLimitError("You can only have 3 rooms"));

        }

      }

      res.status(200).json({statusCode:200,message:"OK",slug:req.body.slug});

    } catch (err) {

      next(new ServerError());

    }

  });

  // list rooms by popular - GET "/_/rooms"
  api.get("/:page", ParseJSON, async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      if (!req.params.page) return next(new BadRequestError("Invalid page number"));

      const page = parseInt(req.params.page);

      const rooms = await roomService.fetchPopularRooms(redis);

      const paginatedRooms = await roomService.paginateRooms(rooms, 20, page);

      res.status(200).json({next: paginatedRooms.next, prev: paginatedRooms.prev, totalPages: paginatedRooms.totalPages, items: paginatedRooms.items});

    } catch (err) {

      console.log(err);

      next(new ServerError());

    }

  });

  // fetch specific room - GET "/_/rooms/@:slug"
  api.get("/@/:slug", async (req:express.Request, res:express.Response, next:express.NextFunction) => {

    try {

      const room = await roomModel.findOne({slug: req.params.slug});

      if (!room) return next(new NotFoundError("Room not found"));

      const rRoom = await redis.get(`rooms:${room.id}`);

      if (!rRoom) return next(new NotFoundError("Room not found"));

      const parsedRoom = JSON.parse(rRoom);

      let combine = {
        name: room.name,
        slug: room.slug,
        id: room.id,
        current_dj: parsedRoom.current_dj,
        users: parsedRoom.users
      }

      const actualRoom = _.pick(combine, ["id", "slug", "current_dj", "welcome_message", "description", "name", "users", "queue_cycle", "queue_locked", "queue_history"]);

      res.status(200).json(actualRoom);

    } catch (err) {

      next(new ServerError());

    }

  });

  return api;

}