import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from 'Bearer <token>'
    
    if (!token) return res.status(403).json({ message: 'No token provided' });
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        
        req.userId = decoded.id;  // Attach the decoded user ID to the request object
        next();  // Proceed to the next middleware or route handler
    });
};
