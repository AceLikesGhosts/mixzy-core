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