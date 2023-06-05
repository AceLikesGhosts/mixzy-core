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

import axios, { AxiosError } from "axios";
import Duration from "durationts";
import config from "config";
import qs from "qs";
import YTSearchRespData, { YTVideoQueryRespData } from "./yt.service.types";

const defaultUrl = "https://youtube.googleapis.com/youtube/v3";

class YTService {

  // query videos
  async queryVideo (cids: string[] | string): Promise<{cid: string, title: string, thumbnail: string, duration: number, unavailable: boolean}[]> {

    let cidsStr;

    if (Array.isArray(cids)) {
      cidsStr = cids.join(",");
    }

    let len = 0;

    try {

      let str = qs.stringify({
        part: "contentDetails,snippet,status",
        id: cidsStr,
        fields: "items(id,contentDetails/duration,snippet(title,thumbnails/default),status/uploadStatus)",
        key: config.get("yt")
      });

      const resp = await axios.get<YTVideoQueryRespData>(`${defaultUrl}/videos?${str}`);

      let out: {cid: string, title: string, thumbnail: string, duration: number, unavailable: boolean}[] = [];

      for (let i = 0; i < resp.data.items.length; i++) {

        // This is a fix for YouTube using weeks in their durations instead of days...
        if (resp.data.items[i].contentDetails.duration.indexOf("W") > -1) {

          const weeksArr = resp.data.items[i].contentDetails.duration.match(/(\d+)W/);

          if (weeksArr === null) throw new Error("Internal Error");

          const weeks = parseInt(weeksArr[1]);

          const days = resp.data.items[i].contentDetails.duration.match(/(\d+)D/);

          if (days) {

            resp.data.items[i].contentDetails.duration = resp.data.items[i].contentDetails.duration.replace(days[0], (parseInt(days[1]) + (weeks*7)).toString() + 'D');

          } else {

            resp.data.items[i].contentDetails.duration = resp.data.items[i].contentDetails.duration.replace('T', (weeks*7).toString() + 'DT')

          }

          resp.data.items[i].contentDetails.duration = resp.data.items[i].contentDetails.duration.replace(weeksArr[0], '');

        }

        let dur = new Duration(resp.data.items[i].contentDetails.duration).inSeconds();

        if (resp.data.items[i].id) {

          let d = {
            cid: resp.data.items[i].id,
            title: resp.data.items[i].snippet.title,
            thumbnail: resp.data.items[i].snippet.thumbnails.default.url,
            duration: dur,
            unavailable: resp.data.items[i].status.uploadStatus != 'processed' && resp.data.items[i].status.uploadStatus != 'uploaded',
          }

          out.push(d);

          len++;
        }

      }

      return out;

    } catch (err) {

      // @ts-ignore
      console.log(err.response);

      throw err;

    }

  }

  // get video
  async getVideo (inCid: string[] | string): Promise<{cid: string, title: string, thumbnail: string, duration: number, unavailable: boolean}[]> {

    let out: {cid: string, title: string, thumbnail: string, duration: number, unavailable: boolean}[] = [];

    let requested = 0;

    let inCids;

    if (Array.isArray(inCid)) {

      inCids = Array.from(Array(Math.ceil(inCid.length / 50)), (_, i) => {
        return inCid.slice(i * 50, i * 50 + 50);
      });

      requested = inCids.length;

      if (requested == 0) return out;

      for (let i = 0; i < requested; i++) {
        
        try {
          
          let d = await this.queryVideo(inCid[i]);

          Object.assign(out, d);

        } catch (err) {

          throw err;

        }

      }

      return out;

    } else {

      if (typeof inCid !== "string") throw new Error("InvalidCid");

      if (inCid.indexOf(",") > -1) {
        throw new Error("StringContainsMultipleIDs");
      }

      const data = await this.queryVideo(inCid);

      return data;

    }

  }

  // search method
  async search (query: string): Promise<{cid: string, title: string, thumbnail: string, duration: number, unavailable: boolean}[]> {

    const inObj = {
      part: "id",
      maxResults: 50,
      q: query,
      type: "video",
      videoEmbeddable: true,
      fields: "items(id)",
      key: config.get("yt"),
      videoCategoryId: 10
    }

    const str = qs.stringify(inObj);

    const url = `${defaultUrl}/search?${str}`;

    try {

      const d = await axios.get<YTSearchRespData>(url);

      let ids = [];

      for (let i = 0; i < d.data.items.length; i++) {

        ids.push(d.data.items[i].id.videoId);

      }

      const out = await this.queryVideo(ids);

      return out;

    } catch (err) {

      throw err;

    }

  }

  // get playlist
  async getPlaylist (data: {playlistid: string, nextPageToken?: string, prevPageToken?: string}): Promise<{nextPageToken?: string, prevPageToken?: string, videos: string[]}> {

    const url = "https://www.googleapis.com/youtube/v3/playlistItems?" + qs.stringify({
		  part: "contentDetails",
		  maxResults: 50,
		  playlistId: data.playlistid,
		  pageToken: data.nextPageToken,
		  fields: "nextPageToken,prevPageToken,items(contentDetails(videoId))",
		  key: config.get("yt")
	  });

    try {

      const response = await axios.get(url);

      let videos: string[] = [];

      response.data.items.forEach((item: any) => {

        videos.push(item.contentDetails.videoId);

      });

      let out = {
        videos,
        nextPageToken: response.data.nextPageToken ? response.data.nextPageToken : null,
        prevPageToken: response.data.prevPageToken ? response.data.prevPageToken : null
      }

      return out;

    } catch (err: any) {

      if (err.response.data.error) {
        throw "playlist does not exist";
      } else {
        throw err;
      }
      
    }

  }

}

export default new YTService();