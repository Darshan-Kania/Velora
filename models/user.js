import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
const userSchema=new mongoose.Schema({
  userId:{
    type:String,
    required:true,
    default:uuidv4,
    unique:true,
  },
  email:{
    type:String,
    required:true,
    unique:true,
  },
  name:{
    type:String,
    required:true,
  },
  accessToken:{
    type:String,
    required:true,
  },
  refreshToken:{
    type:String,
    required:true,
  },
  jwtToken:{
    type:String,
    required:true,
  },
  expiresAt:{
    type:Date,
    required:true,
  },
},{timestamps:true});
export const userModel = mongoose.model("User", userSchema);