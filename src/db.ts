import mongoose from "mongoose";
import config from "config";
import Redis from "ioredis";

const initdb = async (): Promise<Redis> => {

  mongoose.set("strictQuery", false);
  
  try {

    await mongoose.connect(config.get("mongo"));

    console.info("connected mongo database server");

    const r = new Redis(config.get("redis"));

    console.info("Connected to redis cache server");

    return r;

  } catch (err) {

    console.error("Unable to connect to mongoose database");
    process.exit(1);

  }

}

export default initdb;