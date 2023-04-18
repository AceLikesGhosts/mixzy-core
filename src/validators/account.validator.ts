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

import joi from "joi";

export const changeUsername = joi.object({
  username: joi.string().required().min(3).max(45).regex(new RegExp("^(?![_.])(?!.*[_. ]{2})[a-zA-Z0-9._ ]+(?<![_.])$")),
  password: joi.string().required()
});

export const changePasswordValidator = joi.object({
  current_password: joi.string().required().min(7).max(300),
  new_password: joi.string().required().min(7).max(300)
});

export const usernameLookupValidator = joi.object({
  username: joi.string().required().min(3).max(45).regex(new RegExp("^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._ ]+(?<![_.])$"))
});