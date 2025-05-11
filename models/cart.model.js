const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    cartQuantity: Number,
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
