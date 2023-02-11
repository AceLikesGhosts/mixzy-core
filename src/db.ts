/*


  __  __ _   _______             _    
 |  \/  (_) |__   __|           | |   
 | \  / |___  _| |_ __ __ _  ___| | __
 | |\/| | \ \/ / | '__/ _` |/ __| |/ /
 | |  | | |>  <| | | | (_| | (__|   < 
 |_|  |_|_/_/\_\_|_|  \__,_|\___|_|\_\
                                      
* Author: Jordan (LIFELINE) <hello@lifeline1337.dev>
* Copyright (C) 2023 LIFELINE
* Repo: https://github.com/lifeline1337/mixtrack-restful
* LICENSE: MIT <https://github.com/lifeline1337/mixtrack-restful/blob/main/LICENSE>
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