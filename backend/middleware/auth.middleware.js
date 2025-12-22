const { verifyToken: verifyTokenUtil } = require('../utils/jwt');

const verifyToken = function (req, res, next) {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send('Access Denied');

    const verified = verifyTokenUtil(token);
    if (!verified) return res.status(400).send('Invalid Token');

    req.user = verified;
    next();
};

module.exports = { verifyToken };
