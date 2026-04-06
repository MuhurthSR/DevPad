import { createUser,loginUser,getMe as getMeService } from "./auth.service.js";

export const register = async(req,res) => {
  try{
    
    const{username,email,password} = req.body;

    if(!username || !email || !password){
      return res.status(400).json({error : "All fields are required"});
    }

    const {user,token} = await createUser(username,email,password);

    res.status(201).json({
      message : "User Registered Successfully",
      user,
      token
    })
  }catch(error){
    console.error("Registration Error : ",error);
    res.status(500).json({error : "Internal server error during registration."});
  }
};


export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getMeService(userId);

    res.status(200).json(user);

  } catch (error) {
    const isNotFound = error.message === "User Not found";
    console.error("Error in getMe:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};


export const login = async(req,res) => {
  try{
    const {email,password} = req.body;

    if(!email || !password){
      return res.status(400).json({error : "Email and password are required."});
    }

    const authData = await loginUser(email,password);

    res.status(200).json({message : "Login Successful",...authData});
  }catch(error){
    const isAuthError = error.message === "Invalid email or password";
    res.status(isAuthError ? 401 : 500).json({ error: error.message });
  }
};