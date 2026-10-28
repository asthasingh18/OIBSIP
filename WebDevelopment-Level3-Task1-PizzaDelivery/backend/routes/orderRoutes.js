
const express = require("express");
const router = express.Router();

const Pizza = require("../models/Pizza");
const Order = require("../models/Order");
const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

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
      typeof customerName !== "string" ||
      typeof customerPhone !== "string" ||
      typeof deliveryAddress !== "string" ||
      !customerName.trim() ||
      !customerPhone.trim() ||
      !deliveryAddress.trim()
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

// GET: Fetch all orders (admin only)
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error("Fetching orders failed:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders.",
      });
    }
  }
);

// PATCH: Update an order's status (admin only)
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      if (!/^[a-f\d]{24}$/i.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
        });
      }

      const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Order status updated to ${status}.`,
        order,
      });
    } catch (error) {
      console.error("Updating order status failed:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to update order status.",
      });
    }
  }
);

module.exports = router;
