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
import IAccessToken from "./access_token.type";

const AccessToken = new mongoose.Schema({
  access_token: {type: String, required: true, unique: true},
  user: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
  createdAt: { type: Date, expires: (60*60*7), default: Date.now }
});

export default mongoose.model<IAccessToken>("access_tokens", AccessToken);