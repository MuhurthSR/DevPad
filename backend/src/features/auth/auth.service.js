import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {query} from '../../config/db.js';

export const generateToken = (userid,username,email) =>{
  return jwt.sign(
    {id : userid,username : username,email : email},
    process.env.JWT_SECRET,
    {expiresIn : '7d'}
  );
};

export const createUser = async(username,email,plainTextPassword) => {
  
  const saltRound = 10;
  const hashedPassword = await bcrypt.hash(plainTextPassword,saltRound);
  
  const sql = `
  INSERT INTO users (user_name,user_email,password_hash)
  VALUES($1,$2,$3)
  RETURNING id,user_name,user_email,created_at;
  `;

  const result = await query(sql,[username,email,hashedPassword]);
  const user = result.rows[0];
  
  const token = generateToken(user.id,user.user_name,user.user_email);

  return {
    user:{id:user.id,username : user.user_name,email : user.user_email},
    token
  }
};

export const loginUser = async(email,plainTextPassword) =>{
  const sql = `SELECT id, user_name, user_email, password_hash FROM users WHERE user_email = $1`;

  const result = await query(sql,[email]);
  const user = result.rows[0];

  if(!user) throw new Error("Invalid email or password");

  const isValid = await comparePassword(plainTextPassword,user.password_hash);
  if (!isValid) throw new Error("Invalid email or password");

  const token = generateToken(user.id,user.user_name,user.user_email);

  return {
    user:{id:user.id,username : user.user_name,email : user.user_email},
    token
  }
};


const comparePassword = async(plainTextPassword,hashedPassword)=>{
  return await bcrypt.compare(plainTextPassword,hashedPassword)
};