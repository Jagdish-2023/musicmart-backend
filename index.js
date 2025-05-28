require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fs = require("fs");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

const corsOptions = {
  origin: "https://musicmart.vercel.app/",
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
const { Error } = require("mongoose");
const JWT_SECRET = process.env.JWT_SECRET;

initializeDB();

const verifyJwt = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token is required" });
  }
  try {
    const decodeToken = jwt.verify(token, JWT_SECRET);

    req.user = decodeToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired userToken" });
  }
};

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Express");
});

app.get("/products", async (req, res) => {
  try {
    const fetchProducts = await Product.find();

    res.status(200).json(fetchProducts);
  } catch (error) {
    res.status(500).json({ error: "Error occured while fetching products" });
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
  }
});

app.get("/products/category/:categoryName", verifyJwt, async (req, res) => {
  const { categoryName } = req.params;
  try {
    const categoryProducts = await Product.find({ category: categoryName });
    if (categoryProducts.length !== 0) {
      res.status(200).json(categoryProducts);
    } else {
      res.status(404).json({ error: "Selected category is not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/favouriteItems", verifyJwt, async (req, res) => {
  try {
    const favouriteItems = await Favourite.find({
      owner: req.user.id,
    }).populate("item");

    res.status(200).json(favouriteItems);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/cartItems", verifyJwt, async (req, res) => {
  try {
    const allCartItems = await Cart.find({ owner: req.user.id }).populate(
      "item"
    );

    res.status(200).json(allCartItems);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/shipping_addresses", verifyJwt, async (req, res) => {
  try {
    const addresses = await Address.find({ owner: req.user.id });

    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/user_profile_info", verifyJwt, async (req, res) => {
  try {
    const userInfo = await User.findById(req.user.id).select("-password");
    if (userInfo) {
      res.status(200).json(userInfo);
    } else {
      res.status(404).json({ error: "User Profile details not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/order_items", verifyJwt, async (req, res) => {
  try {
    const allItems = await Order.find({ owner: req.user.id });

    res.status(200).send(allItems);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/order-details/:orderId", verifyJwt, async (req, res) => {
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
  }
});

//POST API
app.post("/product/favourite/:productId", verifyJwt, async (req, res) => {
  const productId = req.params.productId;

  try {
    const findFavouriteItem = await Favourite.findOne({
      owner: req.user.id,
      item: productId,
    });
    if (!findFavouriteItem) {
      const newFavouriteItem = new Favourite({
        item: productId,
        owner: req.user.id,
      });

      const savedFavouriteItem = await newFavouriteItem.save();
      await savedFavouriteItem.populate("item");
      res.status(201).json({ savedFavouriteItem });
    } else {
      const removedFavouriteItem = await Favourite.findOneAndDelete({
        item: productId,
        owner: req.user.id,
      });
      res.status(200).json({ removedFavouriteItem });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/product/cart/:productId", verifyJwt, async (req, res) => {
  const productId = req.params.productId;
  const { isInCart } = req.body;

  try {
    const findItemInCart = await Cart.findOne({
      owner: req.user.id,
      item: productId,
    });

    if (!findItemInCart) {
      const newCartItem = new Cart({
        owner: req.user.id,
        item: productId,
        cartQuantity: 1,
      });
      const savedCartItem = await newCartItem.save();
      await savedCartItem.populate("item");
      return res.status(201).json({ savedCartItem });
    }

    if (isInCart === false) {
      const removedCartItem = await Cart.findOneAndDelete({
        owner: req.user.id,
        item: productId,
      });
      res.status(200).json({ removedCartItem });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/product/cart_quantity", verifyJwt, async (req, res) => {
  const { productId, cartQuantity } = req.body;

  try {
    const updateCart = await Cart.findOneAndUpdate(
      { item: productId, owner: req.user.id },
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
  }
});

app.post("/add_ship_address", verifyJwt, async (req, res) => {
  const { data, previousSelectedAddress } = req.body;

  try {
    if (data) {
      data.owner = req.user.id;
    }
    const addNewAddress = new Address(data);
    const savedAddress = await addNewAddress.save();
    if (!previousSelectedAddress) {
      return res
        .status(201)
        .json({ message: "Address added  successfully", savedAddress });
    }
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
  }
});

app.post("/update_address_deliver", verifyJwt, async (req, res) => {
  const { deliverAddressId, notDeliverAddressId } = req.body;
  try {
    const updateDeliverAddress = await Address.findOneAndUpdate(
      { owner: req.user.id, _id: deliverAddressId },
      { isDeliver: true },
      { new: true }
    );
    const updateNotDeliverAddress = await Address.findOneAndUpdate(
      { owner: req.user.id, _id: notDeliverAddressId },
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

app.post("/update_address_details", verifyJwt, async (req, res) => {
  const { dataToUpdate, addressId } = req.body;
  try {
    const updatedAddress = await Address.findOneAndUpdate(
      { owner: req.user.id, _id: addressId },
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
  }
});

app.post("/update_user_profile", verifyJwt, async (req, res) => {
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

app.post("/move_cart_to_order", verifyJwt, async (req, res) => {
  const { orderedItems, deliveryAddress } = req.body;

  try {
    const newOrder = new Order({
      orderedItems,
      deliveryAddress,
      owner: req.user.id,
    });
    const savedItems = await newOrder.save();
    if (savedItems) {
      const allIdToDelete = savedItems.orderedItems.map((item) => item.itemId);

      await Cart.deleteMany({
        owner: req.user.id,
        item: { $in: allIdToDelete },
      });

      res
        .status(200)
        .json({ message: "Order placed successfully.", savedItems });
    } else {
      res.status(500).json({ error: "Failed to place order." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/delete_address/:addressId", verifyJwt, async (req, res) => {
  const addressId = req.params.addressId;

  try {
    const deletedAddress = await Address.findOneAndDelete({
      owner: req.user.id,
      _id: addressId,
    });
    if (deletedAddress) {
      const findIsDeliver = await Address.findOne({
        owner: req.user.id,
        isDeliver: true,
      });
      if (!findIsDeliver) {
        const findFirstAddress = await Address.findOne({
          owner: req.user.id,
        }).sort({ _id: 1 }); //will give the very first created address
        await Address.findByIdAndUpdate(findFirstAddress._id, {
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
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on Port ", PORT);
});
