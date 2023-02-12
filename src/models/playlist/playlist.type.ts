/*


  __  __ _   _______             _    
 |  \/  (_) |__   __|           | |   
 | \  / |___  _| |_ __ __ _  ___| | __
 | |\/| | \ \/ / | '__/ _` |/ __| |/ /
 | |  | | |>  <| | | | (_| | (__|   < 
 |_|  |_|_/_/\_\_|_|  \__,_|\___|_|\_\
                                      
* Author: Jordan (LIFELINE) <hello@lifeline1337.dev>
* Copyright (C) 2023 LIFELINE
* Repo: https://github.com/lifeline1337/mixtrack-restful
* LICENSE: MIT <https://github.com/lifeline1337/mixtrack-restful/blob/main/LICENSE>
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
  _id: string,
  title: string,
  duration: number,
  cid: string,
  type: string
}