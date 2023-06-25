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

export const ImportPlaylistValidator = joi.object({
  name: joi.string().required().max(50)
});