require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json());

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

const Address = require("./models/address.model");
const Product = require("./models/products.model");
const Favourite = require("./models/favourites.model");
const Cart = require("./models/cart.model");
const User = require("./models/user.model");
const Order = require("./models/orders.model");
const initializeDB = require("./db/db.connect");

initializeDB();

// const seedData = async () => {
//   try {
//     const jsonData = fs.readFileSync("products.json");
//     const productsData = JSON.parse(jsonData);
//     for (let product of productsData) {
//       const newProduct = new Product(product);
//       await newProduct.save();
//     }
//   } catch (error) {
//     console.log("Error occured while seeding", error);
//   }
// };

// seedData();

app.get("/", (req, res) => {
  res.send("Express");
});

app.get("/products", async (req, res) => {
  try {
    const fetchProducts = await Product.find();

    res.status(200).json(fetchProducts);
  } catch (error) {
    res.status(500).json({ error: "Error occured while fetching products" });
    console.log("Failed to fetch products", error);
  }
});

app.get("/products/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    const productDetails = await Product.findOne({ _id: productId });

    if (productDetails) {
      res.status(200).json(productDetails);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

app.get("/products/category/:categoryName", async (req, res) => {
  const { categoryName } = req.params;
  try {
    const categoryProducts = await Product.find({ category: categoryName });
    if (categoryProducts.length !== 0) {
      res.status(200).json(categoryProducts);
    } else {
      res.status(404).json({ error: "Selected category is not found" });
    }
  } catch (error) {
    console.log("Error in fetching ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/favouriteItems", async (req, res) => {
  try {
    const favouriteItems = await Favourite.find().populate("item");
    res.status(200).json(favouriteItems);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

app.get("/cartItems", async (req, res) => {
  try {
    const allCartItems = await Cart.find().populate("item");

    res.status(200).json(allCartItems);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

app.get("/shipping_addresses", async (req, res) => {
  try {
    const addresses = await Address.find();
    if (addresses) {
      res.status(200).json(addresses);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/user_profile_info", async (req, res) => {
  try {
    const userInfo = await User.find();
    if (userInfo) {
      res.status(200).json(userInfo);
    } else {
      res.status(404).json({ error: "User Profile details not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error.", error });
  }
});

app.get("/order_items", async (req, res) => {
  try {
    const allItems = await Order.find();
    if (allItems.length > 0) {
      res.status(200).send(allItems);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

app.get("/order-details/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const orderDetails = await Order.findById(orderId);
    if (orderDetails) {
      res.status(200).json(orderDetails);
    } else {
      res.status(404).json({ error: "Order details not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
    console.log(error);
  }
});

//POST API
app.post("/product/favourite/:productId", async (req, res) => {
  const productId = req.params.productId;
  const updateFavourite = req.body;

  try {
    const updatedItem = await Product.findByIdAndUpdate(
      productId,
      updateFavourite,
      { new: true }
    );
    if (updatedItem) {
      if (updateFavourite.isFavourite === true) {
        const newItem = new Favourite({ item: productId });
        const savedFavouriteItem = await newItem.save();
        const newFavouriteItem = await savedFavouriteItem.populate("item");

        res.status(201).json({
          message: "Product added to wishlist",
          updatedItem,
          newFavouriteItem,
        });
      } else {
        const existingItem = await Favourite.findOne({ item: productId });
        if (existingItem) {
          await Favourite.findOneAndDelete({ item: productId });
          res
            .status(200)
            .json({ message: "Product removed from wishlist", updatedItem });
        }
      }
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
    console.log(error);
  }
});

app.post("/product/cart/:productId", async (req, res) => {
  const productId = req.params.productId;
  const { isInCart } = req.body;

  try {
    const updatedItem = await Product.findByIdAndUpdate(
      productId,
      { isInCart },
      {
        new: true,
      }
    );

    if (updatedItem) {
      if (isInCart) {
        const newItem = new Cart({ cartQuantity: 1, item: productId });
        const savedCartItem = await newItem.save();
        const newCartItem = await savedCartItem.populate("item");

        res
          .status(201)
          .json({ message: "Product added To cart", newCartItem, updatedItem });
      } else {
        await Cart.findOneAndDelete({ item: productId });

        res
          .status(200)
          .json({ message: "Product removed from cart", updatedItem });
      }
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
    console.log(error);
  }
});

app.post("/product/cart_quantity", async (req, res) => {
  const { productId, cartQuantity } = req.body;
  try {
    const updateCart = await Cart.findOneAndUpdate(
      { item: productId },
      { cartQuantity },
      { new: true }
    );
    if (updateCart) {
      res.status(200).json(updateCart);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error." });
    console.log(error);
  }
});

app.post("/add_ship_address", async (req, res) => {
  const { data, previousSelectedAddress } = req.body;
  try {
    const addNewAddress = new Address(data);
    const savedAddress = await addNewAddress.save();
    const updatedAddress = await Address.findByIdAndUpdate(
      previousSelectedAddress._id,
      { isDeliver: false },
      { new: true }
    );
    if (savedAddress && updatedAddress) {
      res.status(201).json({
        message: "Address added and updated successfully",
        savedAddress,
        updatedAddress,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error.", error });
    console.log(error);
  }
});

app.post("/update_address_deliver", async (req, res) => {
  const { deliverAddressId, notDeliverAddressId } = req.body;
  try {
    const updateDeliverAddress = await Address.findByIdAndUpdate(
      deliverAddressId,
      { isDeliver: true },
      { new: true }
    );
    const updateNotDeliverAddress = await Address.findByIdAndUpdate(
      notDeliverAddressId,
      { isDeliver: false },
      { new: true }
    );

    if (updateDeliverAddress && updateNotDeliverAddress) {
      res.status(200).json([updateDeliverAddress, updateNotDeliverAddress]);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/update_address_details", async (req, res) => {
  const { dataToUpdate, addressId } = req.body;
  try {
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      dataToUpdate,
      { new: true }
    );
    if (updatedAddress) {
      res
        .status(200)
        .json({ message: "Address updated successfully", updatedAddress });
    } else {
      res.status(404).json({ error: "Address not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
    console.log(error);
  }
});

app.post("/update_user_profile", async (req, res) => {
  const { profileId, dataToUpdate } = req.body;

  try {
    const updatedData = await User.findByIdAndUpdate(profileId, dataToUpdate, {
      new: true,
    });
    if (updatedData) {
      res
        .status(200)
        .json({ message: "Profile updated successfully", updatedData });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error.", error });
  }
});

app.post("/move_cart_to_order", async (req, res) => {
  const { orderedItems, deliveryAddress } = req.body;

  try {
    const newOrder = new Order({ orderedItems, deliveryAddress });
    const savedItems = await newOrder.save();
    if (savedItems) {
      const allIdToDelete = savedItems.orderedItems.map((item) => item.itemId);

      await Cart.deleteMany({ item: { $in: allIdToDelete } });
      await Product.updateMany(
        { _id: { $in: allIdToDelete } },
        { $set: { isInCart: false } }
      );

      res
        .status(200)
        .json({ message: "Order placed successfully.", savedItems });
    } else {
      res.status(500).json({ error: "Failed to place order." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

app.delete("/delete_address/:addressId", async (req, res) => {
  const addressId = req.params.addressId;

  try {
    const deletedAddress = await Address.findByIdAndDelete(addressId);
    if (deletedAddress) {
      const findIsDeliver = await Address.findOne({ isDeliver: true });
      if (!findIsDeliver) {
        await Address.findByIdAndUpdate("67650438890a36594c34bdcb", {
          isDeliver: true,
        });
      }
      res
        .status(200)
        .json({ message: "Address deleted successfully", deletedAddress });
    } else {
      res.status(404).json({ error: "Address not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on Port ", PORT);
});
