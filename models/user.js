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
    required:false,
  },
  refreshToken:{
    type:String,
    required:false,
  },
  jwtToken:{
    type:String,
    required:false,
  },
  expiresAt:{
    type:Date,
    required:false,
  },
},{timestamps:true});
export const userModel = mongoose.model("User", userSchema);