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

      await redis.set(`rooms:${savedRoom.id}`, JSON.stringify({
        id: savedRoom.id,
        current_dj: {
          user: null,
          song: {
            title: null,
            duration: null,
            time: null,
            upvotes: 0,
            downvotes: 0,
            thumbnail: null,
            grabs: 0,
            cid: null
          }
        },
        users: []
      }));

      await roomModel.updateOne({_id: savedRoom.id}, {$addToSet: {staff: {user: userid, promoted_by: userid, rank: 755}}});

      const updatedRoom = await roomModel.findOne({_id: savedRoom.id});

      if (!updatedRoom) return {error: "internal error"};

      return {room: updatedRoom};

    } catch (err) {
      throw err;
    }

  }

  /**
   * fetch popular rooms
   * @param redis 
   * @returns 
   */
  async fetchPopularRooms (redis: Redis): Promise<any[]> {

    try {

      const rooms = await roomModel.find({}).limit(300).exec();

      const roomsids = rooms.map(room => {

        return `rooms:${room.id}`;

      });

      const rRooms = await redis.mget(roomsids);

      const parsedRooms: any[] = rRooms.map(room => {
        
        if (!room) return console.log("unable to parse room");

        return JSON.parse(room);

      });

      const arr: any[] = [];

      rooms.forEach( async (room: IRoom, i) => {

        const findIndexOfRoomIdInArr = parsedRooms.findIndex(r => r.id === room.id);

        if (findIndexOfRoomIdInArr !== -1) {

          let obj = {
            name: room.name,
            id: room.id,
            slug: room.slug,
            current_dj: parsedRooms[findIndexOfRoomIdInArr].current_dj,
            users: parsedRooms[findIndexOfRoomIdInArr].users
          }

          arr.push(obj);

        }

      });

      arr.sort((a, b) => {

        return b.users.length - a.users.length

      });

      return arr;

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