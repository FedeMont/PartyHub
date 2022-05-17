const jwt = require('jsonwebtoken');
const { standardRes } = require('./utils');

const authenticateToken = (req, res, next) => {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return standardRes(res, 401, "No token, unauthorized."); // if there isn't any token

    jwt.verify(token, process.env.token_safe, (err, user) => {
        if (err) {
            // console.log(err);
            return standardRes(res, 403, "Wrong token, forbidden.");
        } else {
            req.user = user;
            next();
        }
    });
};

const generateAccessToken = (mail, role, nome) => {
    return jwt.sign({ mail: mail, role: role, nome: nome }, process.env.token_safe, { expiresIn: '1 day' });
};

module.exports = {
    authenticateToken,
    generateAccessToken
};