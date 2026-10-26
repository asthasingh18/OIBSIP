
const express = require("express");
const router = express.Router();

const Pizza = require("../models/Pizza");
const Order = require("../models/Order");

// POST: Create a new order
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      items,
    } = req.body;

    if (
      !customerName?.trim() ||
      !customerPhone?.trim() ||
      !deliveryAddress?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all delivery details.",
      });
    }

    if (!/^\d{10}$/.test(customerPhone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain 10 digits.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // Verify pizzas and calculate prices on the server
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (
        !item.pizzaId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid pizza or quantity.",
        });
      }

      if (!/^[a-f\d]{24}$/i.test(item.pizzaId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid pizza ID.",
        });
      }

      const pizza = await Pizza.findById(item.pizzaId);

      if (!pizza || !pizza.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "A selected pizza is unavailable.",
        });
      }

      orderItems.push({
        pizzaId: pizza._id,
        name: pizza.name,
        price: pizza.price,
        quantity: item.quantity,
      });

      totalAmount += pizza.price * item.quantity;
    }

    const order = await Order.create({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      items: orderItems,
      totalAmount,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.error("Order creation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to place order.",
    });
  }
});

 
// GET: Fetch all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Fetching orders failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
    });
  }
});


module.exports = router;
