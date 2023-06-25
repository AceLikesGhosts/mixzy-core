import mongoose from "mongoose";
import IAccessToken from "./access_token.type";

const AccessToken = new mongoose.Schema({
  access_token: {type: String, required: true, unique: true},
  user: {type: mongoose.Types.ObjectId, required: true, ref: "accounts"},
  createdAt: { type: Date, expires: (60*60*7), default: Date.now }
});

export default mongoose.model<IAccessToken>("access_tokens", AccessToken);