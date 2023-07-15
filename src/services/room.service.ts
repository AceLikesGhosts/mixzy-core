import { Redis } from "ioredis";
import _ from "lodash";
import roomModel from "../models/room/room.model";
import IRoom from "../models/room/room.type";
import multer from "multer";
import crypto from "crypto";
import config from "config";
import { S3Client } from "@aws-sdk/client-s3";

class RoomService {

  S3 = new S3Client({
    credentials: {
      accessKeyId: config.get("s3.accessKey"),
      secretAccessKey: config.get("s3.accessSecret")
    },
    endpoint: config.get("s3.endpoint"),
    region: config.get("s3.region")
  });

  genPfpHMAC (): string {

    const payload = {
      time: Date.now(),
      random: crypto.randomBytes(20).toString("hex")
    }
    
    const hmac = crypto.createHmac("sha1", crypto.randomBytes(20).toString("hex")).update(payload.toString()).digest("hex");

    return hmac;

  }

  backgroundUpload = multer({
    limits: {fileSize: 5242880},
    fileFilter: (req, file, cb) => {

      if (file.size > 5242880) return cb(new Error("File size limit is 5MB"));

      if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        cb(null, true);
      } else {
        return cb(new Error("Only .png, .jpg and .jpeg format allowed!"))
      }

    },
    storage: multer.diskStorage({
      destination: "/tmp", // store in local storage file system
      filename: async (req, file, cb) => {

        let key = this.genPfpHMAC();

        switch (file.mimetype) {
          case "image/jpg":
            return cb(null, `${key}.jpg`);
          case "image/jpeg":
            return cb(null, `${key}.jpeg`);
          case "image/png":
            return cb(null, `${key}.png`)
        }

      },
    })
  }).single("background");

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
        waitlist: [],
        current_dj: {
          user: null,
          song: {
            title: null,
            duration: null,
            time: null,
            upvotes: [],
            downvotes: [],
            thumbnail: null,
            grabs: [],
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

      arr.forEach(async (r, i) => {

        if (r.users.length === 0) {

          arr.splice(i, 1);

        }

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

  /**
   * update room desc service method
   * @param roomid string
   * @param userid string
   * @returns 
   */
  async updateDescription (roomid: string, userid: string, desc: string): Promise<{error?: string, desc?: string}> {

    try {

      const room = await roomModel.findOne({_id: roomid}).populate("owner").exec();

      if (!room) return {error: "invalid room id"};

      if (room.owner?.id !== userid) return {error: "forbidden"};

      room.description = desc;

      await room.save();

      return {desc: desc};

    } catch (err) {

      throw err;

    }

  }

  /**
   * Update Room Welcome Message Service Method
   * @param roomid string
   * @param userid string
   * @param message string
   */
  async updateRoomWelcomeMessage (roomid: string, userid: string, message: string): Promise<{error?: string, message?: string}> {

    try {

      const room = await roomModel.findOne({_id: roomid}).populate("owner").exec();

      if (!room) return {error: "invalid room id"};

      if (room.owner?.id !== userid) return {error: "forbidden"};

      room.welcome_message = message;

      await room.save();

      return {message};

    } catch (err) {

      throw err;

    }

  }

}

export default new RoomService();