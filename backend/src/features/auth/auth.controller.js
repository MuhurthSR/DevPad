import { createUser,loginUser } from "./auth.service.js";

export const register = async(req,res) => {
  try{
    
    const{username,email,password} = req.body;

    if(!username || !email || !password){
      return res.status(400).json({error : "All fields are required"});
    }

    const newUser = await createUser(username,email,password);

    res.status(201).json({
      message : "User Registered Successfully",
      user : newUser
    })
  }catch(error){
    console.error("Registration Error : ",error);
    res.status(500).json({error : "Internal server error during registration."});
  }
};


export const login = async(req,res) => {
  try{
    const {email,password} = req.body;

    if(!email || !password){
      return res.status(400).json({error : "Email and password are required."});
    }

    const authData = await loginUser(email,password);

    res.status(200).json({message : "Login Successfull",...authData});
  }catch(error){
    res.status(401).json({ error: error.message });
  }
};