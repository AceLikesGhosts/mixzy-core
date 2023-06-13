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

import { Redis } from "ioredis";
import _ from "lodash";
import roomModel from "../models/room/room.model";
import IRoom from "../models/room/room.type";

class RoomService {

  // room creation
  async createRoom (redis: Redis, name: string, slug: string, userid: string): Promise<{error?: string, room?: IRoom}> {

    try {

      const slugExists = await roomModel.findOne({slug});

      if (slugExists) return {error: "Slug already taken"};

      const rooms = await roomModel.find({owner: userid});

      if (rooms[2] && userid !== "6481c5efc75104766b2b1aa1") return {error: "room ratelimit"};

      const newRoom = new roomModel({
        name,
        slug,
        owner: userid
      });

      const savedRoom = await newRoom.save();

      await roomModel.updateOne({_id: savedRoom.id}, {$addToSet: {staff: {user: userid, promoted_by: userid, rank: 755}}});

      const updatedRoom = await roomModel.findOne({_id: savedRoom.id});

      if (!updatedRoom) return {error: "internal error"};

      return {room: updatedRoom};

    } catch (err) {
      throw err;
    }

  }


  async fetchPopularRooms (): Promise<any[]> {

    try {

      const rooms = await roomModel.find().limit(300).exec();

      rooms.sort((a, b) => {

        return a.users.length - b.users.length

      });

      return rooms;

    } catch (err) {

      throw err;

    }

  }

  // paginate Rooms method
  paginateRooms (array: any[], page_size: number, page_number: number): {prev: number | null, next: number | null, totalPages: number, items: any[]} {

    if (page_number === 0) {
      page_number = 1;
    }

    const offset = page_size * (page_number - 1);

    const totalPages = Math.ceil(array.length / page_size);

    const paginated = array.slice((page_number - 1) * page_size, page_number * page_size);

    const d = {
      prev: page_number - 1 ? page_number - 1 : null,
      next: (totalPages > page_number) ? page_number + 1 : null,
      totalPages: totalPages,
      items: paginated
    }

    return d;

  }

}

export default new RoomService();