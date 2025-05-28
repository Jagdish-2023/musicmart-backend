const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
require("dotenv").config();

const User = require("../models/user.model");
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { fullName, dateOfBirth, email, gender, phoneNumber, password } =
    req.body;

  try {
    const findUserEmail = await User.findOne({ email });
    if (findUserEmail) {
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }

    const findUserMobile = await User.findOne({ phoneNumber });
    if (findUserMobile) {
      return res
        .status(409)
        .json({ message: "This Phone number is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      dateOfBirth,
      gender,
      phoneNumber,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to register the Account" });
    console.error(error);
  }
});

router.post("/login", async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    const findUserByPhone = await User.findOne({ phoneNumber });
    if (!findUserByPhone) {
      return res.status(400).json({ message: "Invalid Phone number" });
    }

    const verifyPassword = await bcrypt.compare(
      password,
      findUserByPhone.password
    );

    if (!verifyPassword) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const jwtToken = jwt.sign(
      { role: "user", id: findUserByPhone._id },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res
      .status(200)
      .json({ message: "Logged in successfully", token: jwtToken });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to login into your Account", error: error });
  }
});

module.exports = router;
