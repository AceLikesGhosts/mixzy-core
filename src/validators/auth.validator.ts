import joi from "joi";

// register validator
export const registerValidator = joi.object({
  email: joi.string().required().email().max(300),
  username: joi.string().required().min(3).max(45).regex(new RegExp("^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._ ]+(?<![_.])$")),
  password: joi.string().required().min(7).max(300),
  captcha: joi.string().required()
});

// login validator
export const loginValidator = joi.object({
  email: joi.string().required().email(),
  password: joi.string().required()
});

// refresh validator
export const refreshValidator = joi.object({
  refresh_token: joi.string().required()
});