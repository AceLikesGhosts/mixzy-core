import mongoose from "mongoose";

export default interface IYTSearchStore extends mongoose.Document {
  query: string,
  results: IYTSearchStoreResult[]
}

interface IYTSearchStoreResult {
  cid: string,
  duration: number,
  title: string,
  thumbnail: string,
  unavailable: boolean
}