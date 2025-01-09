const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    cartQuantity: Number,
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
