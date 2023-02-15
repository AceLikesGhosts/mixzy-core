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

export interface YTVideoQueryRespData {
  items: {
    id: string,
    contentDetails: {
      duration: string
    },
    status: {
      uploadStatus: string
    },
    snippet: {
      title: string,
      thumbnails: {
        default: {
          url: string,
          width: number,
          height: number
        }
        high: {
          url: string,
          width: number,
          height: number
        },
        medium: {
          url: string,
          width: number,
          height: number
        },
        standard: {
          url: string,
          width: string,
          height: string
        },
        maxres: {
          url: string,
          width: number,
          height: number
        }
      }
    }
  }[]
}

export default interface YTSearchRespData {
  items: {
    id: {
      kind: string,
      videoId: string,
      channelId: string,
      playlistId: string
    },
    snippet: {
      title: string,
      thumbails: {
        default: {
          url: string,
          width: number,
          height: number
        }
      }
    }
  }[]
}