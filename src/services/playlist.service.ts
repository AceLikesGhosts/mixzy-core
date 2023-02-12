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

}

export default new PlaylistService();