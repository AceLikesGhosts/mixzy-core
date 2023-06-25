import mongoose from "mongoose";
import IYTSearchStore from "./yt_search_store.type";

const YTSearchStore = new mongoose.Schema({
  query: {type: String, required: true, unique: true},
  results: [{
    cid: {type: String, required: true},
    title: {type: String, required: true},
    thumbnail: {type: String, required: true},
    duration: {type: Number, required: true},
    unavailable: {type: Boolean, required: true}
  }]
});

export default mongoose.model<IYTSearchStore>("yt_search_stores", YTSearchStore);