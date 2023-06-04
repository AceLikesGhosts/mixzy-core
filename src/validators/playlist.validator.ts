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

export const CreatePlaylistValidator = joi.object({
  name: joi.string().required().max(50)
});

export const DeletePlaylistValidator = joi.object({
  password: joi.string().required()
});

export const PlaylistYTSearch = joi.object({
  q: joi.string().required().min(2).max(500)
});

export const RenamePlaylistValidator = joi.object({
  name: joi.string().required().max(50)
});