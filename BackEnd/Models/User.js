const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: "" },
    role: { type: String, enum: ["admin", "member", "user"], default: "member" }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;