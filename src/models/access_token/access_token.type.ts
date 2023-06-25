import mongoose from "mongoose";
import IAccount from "../account/account.type";

export default interface IAccessToken extends mongoose.Document {
  access_token: string,
  user: IAccount
}