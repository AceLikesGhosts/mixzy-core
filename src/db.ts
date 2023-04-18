/*
  __  __           _                      _ 
 |  \/  |         (_)                    | |
 | \  / |_   _ ___ _  ___ _ __   __ _  __| |
 | |\/| | | | / __| |/ __| '_ \ / _` |/ _` |
 | |  | | |_| \__ \ | (__| |_) | (_| | (_| |
 |_|  |_|\__,_|___/_|\___| .__/ \__,_|\__,_|
                         | |                
                         |_|                

* Author: Jordan (LIFELINE) <hello@lifeline1337.dev>
* Copyright (C) 2023 LIFELINE
* Repo: https://github.com/musicpadnet/musicpad-core
* LICENSE: MIT <https://github.com/musicpadnet/musicpad-core/blob/main/LICENSE>
*/

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