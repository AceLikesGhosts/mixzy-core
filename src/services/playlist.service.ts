import { IPlaylistSong } from "../models/playlist/playlist.type";
import playlistModel from "../models/playlist/playlist.model";
import _ from "lodash";

class PlaylistService {

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

}

export default new PlaylistService();