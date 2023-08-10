const jwt = require("jsonwebtoken")
const Jwt_secret = "faslkfocvneofu"
const mongoose = require("mongoose")
const User = mongoose.model("User");

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json({ error: "Access Denies: No token sent" })
    }
    const token = authorization.replace("Bearer ", "")
    jwt.verify(token, Jwt_secret, (err, payload) => {
        if (err) {
            return res.status(401).json({ error: "Invalid Token" })
        }
        const { id } = payload
        User.findById(id).then(userData => {
            if (!userData) {
                return res.status(404).json({ error: "User not found" });
            }
            req.user = userData;
            next();
        }).catch(err => {
            return res.status(500).json({ error: "Server error" });
        })
    })

}