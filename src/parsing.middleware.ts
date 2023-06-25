import express from "express";

export const ParseJSON = express.json({
  limit: "100kb"
});

export const ParseURLEncoded = express.urlencoded({extended: true});