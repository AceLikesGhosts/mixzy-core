import axios from "axios";
import config from "config";
import qs from "qs";
import { SCSong, SCPlaylist } from "./soundcloud.service.type";

class SCService {
  
  baseUrl: string = "https://api-v2.soundcloud.com";

  // search for soundcloud song
  async search (query: string): Promise<SCSong[]> {

    try {

      const str = qs.stringify({
        client_id: config.get("sc"),
        q: query,
        limit: 50
      });

      const data = await axios.get<{collection: SCSong[]}>(`${this.baseUrl}/search/tracks?${str}`);

      const returnData = data.data.collection.map((obj) => {
        return {
          id: obj.id,
          duration: obj.duration,
          uri: obj.uri,
          artwork_url: obj.artwork_url,
          title: obj.title,
          kind: obj.kind,
          embeddable_by: obj.embeddable_by
        }
      });

      return returnData;

    } catch (err) {

      throw err;

    }

  }

  // fetch track by id
  async fetchTrack (trackid: string): Promise<SCSong> {

    try {

      const str = qs.stringify({
        client_id: config.get("sc")
      });

      const data = await axios.get<SCSong>(`${this.baseUrl}/tracks/${trackid}?${str}`);

      return data.data;

    } catch (err) {

      throw err;

    }

  }

  // split array into four
  async splitArrayIntoFour<T>(arr: T[]): Promise<T[][]> {
    const totalLength = arr.length;
    const chunkSize = Math.ceil(totalLength / 4); // Divide the length by 4 and round up
  
    const result: T[][] = [];
  
    for (let i = 0; i < totalLength; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      result.push(chunk);
    }
  
    return result;
  }

  // get users soundcloud playlists
  async fetchPlaylist (url: string): Promise<{success: boolean, playlist?: SCSong[]}> {

    try {

      const str = qs.stringify({
        client_id: config.get("sc"),
        url: url
      });

      const data = await axios.get<SCPlaylist>(`${this.baseUrl}/resolve?${str}`);

      if (data.data.kind === "playlist") {

        if (data.data.tracks.length > 200) {

          data.data.tracks.splice(200, (data.data.tracks.length));

        }

        let splitArrays = await this.splitArrayIntoFour(data.data.tracks);

        let ids1 = splitArrays[0].map(obj => {

          return obj.id;

        });

        let ids2 = splitArrays[1].map(obj => {

          return obj.id;

        });

        let ids3 = splitArrays[2].map(obj => {

          return obj.id;

        });

        let ids4 = splitArrays[3].map(obj => {

          return obj.id;

        });

        const str1 = qs.stringify({
          client_id: config.get("sc"),
          representation: "full",
          ids: ids1.join(",")
        });

        const data1 = await axios.get<SCSong[]>(`${this.baseUrl}/tracks?${str1}`);

        const str2 = qs.stringify({
          client_id: config.get("sc"),
          representation: "full",
          ids: ids2.join(",")
        });

        const data2 = await axios.get<SCSong[]>(`${this.baseUrl}/tracks?${str2}`);

        const str3 = qs.stringify({
          client_id: config.get("sc"),
          representation: "full",
          ids: ids3.join(",")
        });

        const data3 = await axios.get<SCSong[]>(`${this.baseUrl}/tracks?${str3}`);

        const str4 = qs.stringify({
          client_id: config.get("sc"),
          representation: "full",
          ids: ids4.join(",")
        });

        const data4 = await axios.get<SCSong[]>(`${this.baseUrl}/tracks?${str4}`);

        const sngs = [
          ...data1.data,
          ...data2.data,
          ...data3.data,
          ...data4.data
        ]

        return {success: true, playlist: sngs};

      } else {

        return {success: false};

      }

    } catch (err) {

      throw err;

    }

  }

}

export default new SCService();