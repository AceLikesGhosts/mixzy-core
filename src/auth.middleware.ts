import express from "express";
import accessTokenModel from "./models/access_token/access_token.model";

export const auth = async (req:express.Request, res:express.Response, next:express.NextFunction) => {

  try {

    const header = req.headers["authorization"];

    if (!header) return res.status(401).json({status:401,error:"Unauthenticated","message":"Invalid token"});

    const token = header.split(" ")[1];

    if (header.startsWith("Bearer")) {

      const accessToken = await accessTokenModel.findOne({access_token: token}).populate("user").exec();

      if (!accessToken) return res.status(401).json({status:401,error:"Unauthenticated","message":"Invalid token"});

      res.locals.user = accessToken.user;
      res.locals.token = token;

      next();

    } else {

      res.status(401).json({status:401,error:"Unauthenticated","message":"Invalid token"});

    }

  } catch (err) {

    throw err;

  }

}