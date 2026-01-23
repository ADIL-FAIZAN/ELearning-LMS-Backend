const express = require("express");
const { UserInterface} = require("../../model/User.model");

declare global {
  namespace Express {
    interface Request {
      user?: UserInterface; // Define the type of your user object here
    }
  }
}

