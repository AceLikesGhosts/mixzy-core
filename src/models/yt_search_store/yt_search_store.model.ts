import mongoose from "mongoose";
import IYTSearchStore from "./yt_search_store.type";

const YTSearchStore = new mongoose.Schema({
  query: {type: String, required: true, unique: true},
  results: [{
    cid: {type: String, required: true},
    title: {type: String, required: true},
    thumbnail: {type: String, required: true},
    duration: {type: Number, required: true},
    unavailable: {type: Boolean, required: true},
    createdAt: { type: Date, expires: (60*60*24*15), default: Date.now } // expire youtube search record at 15 days to comply with youtube's developer TOS :)))))
  }]
});

export default mongoose.model<IYTSearchStore>("yt_search_stores", YTSearchStore);