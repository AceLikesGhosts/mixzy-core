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
import IAccount from "../account/account.type";

export interface IPlaylist extends mongoose.Document {
  id: string,
  name: string,
  songs: IPlaylistSong[],
  isActive: boolean,
  owner: IAccount
}

export interface IPlaylistSong {
  _id?: string,
  title: string,
  duration: number,
  cid: string,
  type: string,
  thumbnail: string,
  unavailable: boolean
}