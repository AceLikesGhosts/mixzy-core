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

import { IPlaylistSong } from "../models/playlist/playlist.type";
import playlistModel from "../models/playlist/playlist.model";
import _ from "lodash";
import argon2 from "argon2";
import IAccount from "../models/account/account.type";
import ytService from "./yt.service";
import YTSearchStore from "../models/yt_search_store/yt_search_store.model";

class PlaylistService {

  // create playlist method
  async createPlaylist (userid: string, name: string): Promise<{error?: string, playlist?: {id: string, name: string, songs: IPlaylistSong[], isActive: boolean}}> {
    
    try {

      const playlists = await playlistModel.find({owner: userid});

      if (playlists[4]) return {error: "You can only have 5 playlists"};

      const newPlaylist = new playlistModel({
        name,
        owner: userid
      });

      const savedPlaylist = await newPlaylist.save();

      const returnData = _.pick(savedPlaylist, ["id", "name", "songs", "isActive"]);

      return {playlist: returnData};

    } catch (err) {

      throw err;

    }

  }

  // delete playlist method
  async deletePlaylist (user: IAccount, playlistid: string, password: string): Promise<{error?:string, success?:boolean}> {
    
    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Playlist does not exist"};

      if (playlist.owner.id !== user.id) return {error: "Access Denied"};

      if (await argon2.verify(user.hash, password) !== true) return {error: "Invalid password"};

      await playlist.remove();

      return {success: true};

    } catch (err) {

      throw err;

    }

  }

  // fetch user playlists method
  async fetchPlaylists (userid: string): Promise<{playlists: {name: string, isActive: boolean, id: string, songCount: number}[]}> {

    try {

      let returnPlaylists = [];

      const playlists = await playlistModel.find({owner: userid});

      if (!playlists[0]) return {playlists: []};

      for (let i = 0; i < playlists.length; i++) {

        let playlist = {
          name: playlists[i].name,
          id: playlists[i].id,
          isActive: playlists[i].isActive,
          songCount: playlists[i].songs.length
        }

        returnPlaylists.push(playlist);

      }

      return {playlists: returnPlaylists};

    } catch (err) {

      throw err;

    }

  }

  // delete song from playlist
  async deletePlaylistSong (userid: string, playlistid: string, songid: string): Promise<{error?: string, success?: boolean}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Not Found Error"};

      if (playlist.owner.id !== userid) return {error: "Forbidden"};

      await playlistModel.updateOne({_id: playlistid}, {$pull: {songs: {_id: songid}}});

      return {success: true};

    } catch (err) {

      throw err;

    }

  }

  // youtube search
  async YTSearch (q: string): Promise<{cid: string, title: string, duration: number, thumbnail: string, unavailable: boolean}[]> {

    try {

      const store = await YTSearchStore.findOne({query: q});

      if (store) {

        let rdata = [];

        for (let i = 0; i < store.results.length; i++) {
        
          let d = {
            cid: store.results[i].cid,
            title: store.results[i].title,
            duration: store.results[i].duration,
            thumbnail: store.results[i].thumbnail,
            unavailable: store.results[i].unavailable
          }

          rdata.push(d);

        }

        return rdata;

      } else {

        const d = await ytService.search(q);

        return d;

      }

    } catch (err) {

      throw err;

    }

  }

  // add song to playlist
  async AddSongPlaylist (userid: string, playlistid: string, cid: string): Promise<{error?: string, success?: boolean}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Not found"};

      if (playlist.songs[149]) return {error: "Maximum songs"};

      if (playlist.owner.id !== userid) return {error: "Forbidden"};

      let ids: string[] = [];

      ids.push(cid);

      const video = await ytService.queryVideo(ids);

      if (!video[0]) return {error: "Video does not exist"};

      await playlistModel.updateOne({_id: playlistid}, {$push: {songs: {cid: video[0].cid, title: video[0].title, duration: video[0].duration, thumbnail: video[0].thumbnail, unavailable: video[0].unavailable, $position: 0}}});

      return {success: true};

    } catch (err) {

      throw err;

    }

  }

  // paginate Songs method
  async paginateSongs (array: {_id?: string, cid: string, type: string, title: string, duration: number, thumbnail: string, unavailable: boolean}[], page_size: number, page_number: number): Promise<{_id?: string, cid: string, type: string, title: string, duration: number, thumbnail: string, unavailable: boolean}[]> {

    if (page_number === 0) {
      page_number = 1;
    }

    return array.slice((page_number - 1) * page_size, page_number * page_size);
  }

  // fetch playlist songs
  async fetchPlaylistSongs (playlistid: string, userid: string, page: number): Promise<{error?: string, songs?: {_id?: string, type: string, cid: string, title: string, duration: number, thumbnail: string, unavailable: boolean}[]}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Playlist not found"};

      if (playlist.owner.id !== userid) return {error: "Forbidden"};

      const paginatedSongs = await this.paginateSongs(playlist.songs, 20, page);

      return {songs: paginatedSongs};

    } catch (err) {
      throw err;
    }

  }

  // move song to position in playlist
  async movePlaylistSong (userid: string, playlistid: string, songid: string, position: number): Promise<{error?: string, success?: boolean}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Playlist not found"};

      if (playlist.owner.id !== userid) return {error: "Foribdden"};

      const fromIndex = playlist.songs.findIndex(obj => obj._id?.toString() === songid);

      const toIndex = position;

      let element = playlist.songs.splice(fromIndex, 1)[0];

      playlist.songs.splice(toIndex, 0, element);

      await playlistModel.updateOne({_id: playlistid}, {$set: {songs: playlist.songs}});

      return {success: true};

    } catch (err) {

      throw err;

    }

  }

  // move playlist song to top
  async movePlaylistSongToTop (userid: string, playlistid: string, songid: string): Promise<{error?: string, success?: boolean}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Playlist not found"};

      if (playlist.owner.id !== userid) return {error: "Forbidden"}

      const fromIndex = playlist.songs.findIndex(obj => obj._id?.toString() === songid);

      const toIndex = 0;

      let element = playlist.songs.splice(fromIndex, 1)[0];

      playlist.songs.splice(toIndex, 0, element);

      await playlistModel.updateOne({_id: playlistid}, {$set: {songs: playlist.songs}});

      return {success: true};

    } catch (err) {

      throw err;

    }

  }

}

export default new PlaylistService();