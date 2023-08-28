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