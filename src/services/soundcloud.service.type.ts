export interface SCSong {
  title: string,
  artwork_url: string,
  duration: number,
  id: number,
  embeddable_by: string,
  uri: string,
  kind: string
}

export interface SCPlaylist {
  title: string,
  id: string,
  kind: string,
  tracks: SCSong[]
}