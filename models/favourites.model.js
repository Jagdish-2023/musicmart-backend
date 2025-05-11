const mongoose = require("mongoose");

const favouritesSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Favourite = mongoose.model("Favourite", favouritesSchema);
module.exports = Favourite;
