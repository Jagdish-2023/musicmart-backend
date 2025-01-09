const mongoose = require("mongoose");
const mongoURI = process.env.MONGODB_URI;

const initializeDB = async () => {
  try {
    const connection = await mongoose.connect(mongoURI);
    if (connection) {
      console.log("DB connect successfully");
    }
  } catch (error) {
    console.log("Error to connect ", error);
  }
};

module.exports = initializeDB;
