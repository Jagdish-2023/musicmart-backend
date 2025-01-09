const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userFullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  pincode: { type: String, required: true },
  locality: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  addressType: { type: String, enum: ["Home", "Work"], required: true },
  isDeliver: { type: Boolean, default: false, required: true },
  isDefault: { type: Boolean, default: false },
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
