import mongoose from "mongoose";
import IRefreshToken from "./refresh_token.type";

const RefreshToken = new mongoose.Schema({
  refresh_token: {type: String},
  access_token: {type: String, required: true, unique: true},
  user: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
  createdAt: { type: Date, expires: (60*60*24*7), default: Date.now }
});

export default mongoose.model<IRefreshToken>("refresh_tokens", RefreshToken);