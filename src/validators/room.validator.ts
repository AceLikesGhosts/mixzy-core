import joi from "joi";

export const createRoomValidator = joi.object({
  name: joi.string().required().min(2).max(80),
  slug: joi.string().required().min(2).max(80).regex(new RegExp("^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._ ]+(?<![_.])$"))
});