const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderedItems: [
      {
        itemId: String,
        quantity: Number,
        itemName: String,
        price: Number,
        imageUrl: String,
      },
    ],
    deliveryAddress: {
      userFullName: String,
      mobileNumber: Number,
      pincode: Number,
      locality: String,
      address: String,
      district: String,
      state: String,
      addressType: String,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
