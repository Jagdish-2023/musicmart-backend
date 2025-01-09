const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: String,
    brand: String,
    sellPrice: Number,
    mrpPrice: Number,
    rating: Number,
    category: String,
    imagesUrl: {
      mainImage: String,
      previewImages: [
        {
          id: Number,
          imgUrl: String,
        },
      ],
    },
    isFavourite: Boolean,
    isInCart: Boolean,
    isCOD: Boolean,
    isFreeDelivery: Boolean,
    replacePolicy: Number,
    description: [String],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
