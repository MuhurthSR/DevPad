import jwt from 'jsonwebtoken';

export const verifyToken = (req,res,next) => {
  const authHeader  = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')){
    return res.status(401).json({error : 'Access Denied. No valid token provided'});
  }

  const token = authHeader.split(' ')[1];

  try{
    const decodePayLoad = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decodePayLoad;

    next();
  }catch(error){
    return res.status(403).json({error : 'Invalid or Expired Token.'});
  }
};