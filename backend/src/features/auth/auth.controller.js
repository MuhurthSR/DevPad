import { createUser,loginUser } from "./auth.service.js";

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

    const sql = `SELECT id, user_name, user_email FROM users WHERE id = $1`;
    const result = await query(sql, [userId]);

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
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