const mongoose=require("mongoose");
const { v4: uuidv4 } = require("uuid");
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
module.exports=mongoose.model("User",userSchema);