import mongoose from "mongoose";
import IRoom from "./room.type";

const Room = new mongoose.Schema({
  name: {type: String, required: true},
  slug: {type: String, required: true, unique: true},
  owner: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
  welcome_message: {type: String, default: null},
  description: {type: String, default: null},
  queue_cycle: {type: Boolean, required: true, default: true},
  queue_locked: {type: Boolean, required: true, default: false},
  perma_bans: [{
    user: {type: mongoose.Types.ObjectId, required: true, ref:"accounts"},
    by: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
    at: {type: Date, required: true, default: Date.now}
  }],
  perma_mutes: [{
    user: {type: mongoose.Types.ObjectId, required: true, ref:"accounts"},
    by: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
    at: {type: Date, required: true, default: Date.now}
  }],
  perma_queue_bans: [{
    user: {type: mongoose.Types.ObjectId, required: true, ref:"accounts"},
    by: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
    at: {type: Date, required: true, default: Date.now}
  }],
  queue_history: [{
    played_by: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
    title: {type: String, required: true},
    cid: {type: String, required: true},
    thumbnail: {type: String, required: true},
    duration: {type: Number, required: true},
    upvotes: {type: Number, required: true},
    grabs: {type: Number, required: true},
    downvotes: {type: Number, required: true},
    at: {type: Date, required: true, default: Date.now}
  }],
  staff: [{
    user: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
    promoted_by: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
    rank: {type: Number, required: true},
    at: {type: Date, required: true, default: Date.now}
  }]
});

Room.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export default mongoose.model<IRoom>("rooms", Room);