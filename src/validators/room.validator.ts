import joi from "joi";

export const createRoomValidator = joi.object({
  name: joi.string().required().min(2).max(80),
  slug: joi.string().required().min(2).max(80).regex(new RegExp("^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._ ]+(?<![_.])$"))
});

export const updateDescriptionValidator = joi.object({
  description: joi.string().required().max(500)
});

export const updateWelcomeMessageValidator = joi.object({
  message: joi.string().required().max(150)
});