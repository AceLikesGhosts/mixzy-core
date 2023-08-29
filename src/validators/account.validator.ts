import joi from "joi";

export const changeUsername = joi.object({
  username: joi.string().required().min(3).max(45).regex(new RegExp("^(?![_.])(?!.*[_. ]{2})[a-zA-Z0-9._ ]+(?<![_.])$")),
  password: joi.string(),
  code: joi.string().min(6).max(6)
});

export const changePasswordValidator = joi.object({
  current_password: joi.string().required().min(7).max(300),
  new_password: joi.string().required().min(7).max(300),
  code: joi.string().max(6).min(6)
});

export const usernameLookupValidator = joi.object({
  username: joi.string().required().min(3).max(45).regex(new RegExp("^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._ ]+(?<![_.])$"))
});

export const verify2FaValidator = joi.object({
  code: joi.string().required().max(6).min(6)
});