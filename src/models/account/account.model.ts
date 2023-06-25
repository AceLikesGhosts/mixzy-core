import mongoose from "mongoose";
import IAccount from "./account.type";

const Account = new mongoose.Schema({
  email: {type: String, required: true, unique: true},
  username: {type: String, required: true, unique: true},
  profile_image: {type: String, default: null},
  hash: {type: String, required: true}
});

Account.set("toJSON", {
  versionKey: false,
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
  },
  virtuals: true
});

export default mongoose.model<IAccount>("accounts", Account);