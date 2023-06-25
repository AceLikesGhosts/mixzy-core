import { IPlaylist, IPlaylistSong } from "../models/playlist/playlist.type";
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

      if (!playlists[0]) {

        const newPlaylist = new playlistModel({
          name,
          owner: userid,
          isActive: true
        });

        const savedPlaylist = await newPlaylist.save();

        const returnData = _.pick(savedPlaylist, ["id", "name", "songs", "isActive"]);

        return {playlist: returnData};

      } else {

        const newPlaylist = new playlistModel({
          name,
          owner: userid
        });

        const savedPlaylist = await newPlaylist.save();

        const returnData = _.pick(savedPlaylist, ["id", "name", "songs", "isActive"]);

        return {playlist: returnData};

      }

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
  async fetchPlaylists (userid: string): Promise<{playlists: {name: string, isActive: boolean, id: string, songCount: number, songs: any[]}[]}> {

    try {

      let returnPlaylists = [];

      const playlists = await playlistModel.find({owner: userid});

      if (!playlists[0]) return {playlists: []};

      for (let i = 0; i < playlists.length; i++) {

        let playlist = {
          name: playlists[i].name,
          id: playlists[i].id,
          isActive: playlists[i].isActive,
          songCount: playlists[i].songs.length,
          songs: playlists[i].songs
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

        const newsearchStore = new YTSearchStore({
          query: q,
          results: d
        });

        await newsearchStore.save();

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
  async paginateSongs (array: {_id?: string, cid: string, type: string, title: string, duration: number, thumbnail: string, unavailable: boolean}[], page_size: number, page_number: number): Promise<{items: {_id?: string, cid: string, type: string, title: string, duration: number, thumbnail: string, unavailable: boolean}[], next: number | null, prev: number | null, totalPages: number}> {

    if (page_number === 0) {
      page_number = 1;
    }

    const offset = page_size * (page_number - 1);

    const totalPages = Math.ceil(array.length / page_size);

    const paginated = array.slice((page_number - 1) * page_size, page_number * page_size);

    return {
      items: paginated,
      prev: page_number - 1 ? page_number - 1 : null,
      next: (totalPages > page_number) ? page_number + 1 : null,
      totalPages: totalPages,
    }
  }

  // fetch playlist songs
  async fetchPlaylistSongs (playlistid: string, userid: string, page: number): Promise<{error?: string, songs?: any[]}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Playlist not found"};

      if (playlist.owner.id !== userid) return {error: "Forbidden"};

      return {songs: playlist.songs};

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

  // activate a playlist for user
  async activatePlaylist (playlistid: string, userid: string): Promise<{error?: string, success?: boolean}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Invalid playlist"};

      if (playlist.owner.id !== userid) return {error: "Forbidden"};

      if (playlist.isActive === true) return {error: "Already active"};

      await playlistModel.updateMany({owner: userid}, {$set: {isActive: false}});

      playlist.isActive = true;

      await playlist.save();

      return {"success": true};

    } catch (err) {

      throw err;

    }

  }

  // rename a playlist
  async renamePlaylist (name: string, playlistid: string, userid: string): Promise<{error?: string, success?: boolean}> {

    try {

      const playlist = await playlistModel.findOne({_id: playlistid}).populate("owner").exec();

      if (!playlist) return {error: "Invalid playlist"};

      if (playlist.owner.id !== userid) return {error: "Forbidden"};

      playlist.name = name;

      await playlist.save();

      return {success: true};

    } catch (err) {

      throw err;

    }

  }

  // import a playlist
  async importPlaylist (playlistid: string, name: string, userid: string): Promise<{playlist: IPlaylist}> {

    try {

      const playlists = await playlistModel.find({owner: userid});

      if (playlists[4]) {

        throw "you can only have 5 playlists";

      } else {

        let videos = [];

        const results = await ytService.getPlaylist({playlistid});

        const vids = await ytService.queryVideo(results.videos);

        videos.push(vids);

        if (results.nextPageToken) {
        
          const results2 = await ytService.getPlaylist({playlistid, nextPageToken: results.nextPageToken});

          const vids2 = await ytService.queryVideo(results2.videos);

          videos.push(vids2);

          if (results2.nextPageToken) {

            const results3 = await ytService.getPlaylist({playlistid, nextPageToken: results2.nextPageToken});

            const vids3 = await ytService.queryVideo(results3.videos);

            videos.push(vids3);

            if (results3.nextPageToken) {

              const results4 = await ytService.getPlaylist({playlistid, nextPageToken: results3.nextPageToken});

              const vids4 = await ytService.queryVideo(results4.videos);

              videos.push(vids4);

            }

          }

        }

        if (!playlists[0]) {

          const newPlaylist = await new playlistModel({
            name,
            owner: userid,
            songs: _.flatten(videos),
            isActive: true
          });
  
          const newpl = await newPlaylist.save();
  
          return {playlist: newpl};

        } else {

          const newPlaylist = await new playlistModel({
            name,
            owner: userid,
            songs: _.flatten(videos),
            isActive: false
          });
  
          const newpl = await newPlaylist.save();
  
          return {playlist: newpl};

        }

      }

    } catch (err) {

      throw err;

    }

  }

}

export default new PlaylistService();