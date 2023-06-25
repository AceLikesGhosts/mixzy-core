import mongoose from "mongoose";
import IAccount from "../account/account.type";

export default interface IRefreshToken extends mongoose.Document {
  access_token: string,
  refresh_token: string,
  user: IAccount
}