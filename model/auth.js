const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String
})

mongoose.model("User", userSchema)