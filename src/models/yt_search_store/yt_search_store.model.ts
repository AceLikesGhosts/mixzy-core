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