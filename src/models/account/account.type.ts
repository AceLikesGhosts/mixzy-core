import mongoose from "mongoose";

export default interface IAccount extends mongoose.Document {
  email: string,
  id: string,
  username: string,
  profile_image: string | null,
  hash: string
}