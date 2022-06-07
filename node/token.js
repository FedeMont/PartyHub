const jwt = require('jsonwebtoken');
const { standardRes, mongoose, documents} = require('./utils');
const {errHandler} = require("./error_handlers");

const TokenBlackList = mongoose.model("TokenBlackList", documents.tokenBlackListSchema);

const authenticateToken = (req, res, next) => {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return standardRes(res, 401, "No token, unauthorized."); // if there isn't any token

    TokenBlackList.find({ token: token }, "", (err, tokens) => {
        if (errHandler(res, err, "token black list")) {
            console.log(tokens);

            if (tokens.length !== 0)  return standardRes(res, 403, "Wrong token, forbidden.");

            jwt.verify(token, process.env.token_safe, (err, user) => {
                if (err) {
                    // console.log(err);
                    return standardRes(res, 403, "Wrong token, forbidden.");
                } else {
                    user["token"] = token;
                    req.user = user;
                    next();
                }
            });
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