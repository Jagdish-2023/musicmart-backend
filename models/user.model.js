const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    dateOfBirth: String,
    gender: String,
    email: String,
    phoneNumber: Number,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
