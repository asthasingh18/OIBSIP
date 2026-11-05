
const express = require("express");
const router = express.Router();

const Pizza = require("../models/Pizza");
const Order = require("../models/Order");
const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// POST: Create a new order
router.post("/", protect, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      paymentMethod = "COD",
      items,
    } = req.body;
    if (!["COD", "Online"].includes(paymentMethod)) {
  return res.status(400).json({
    success: false,
    message: "Invalid payment method.",
  });
}

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
      userId: req.user ? req.user._id : null,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      paymentReference:
        paymentMethod === "Online"
          ? `MOCK-${Date.now()}`
          : null,
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
// POST: Simulate online payment (DEMO ONLY)
router.post("/:id/mock-payment", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user.role !== "admin" &&
      order.userId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to pay for this order.",
      });
    }

    if (order.paymentMethod !== "Online") {
      return res.status(400).json({
        success: false,
        message: "This order does not use online payment.",
      });
    }

    if (order.paymentStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Payment has already been processed.",
      });
    }

    order.paymentStatus = "Paid";
    order.paymentId = `MOCK-PAY-${Date.now()}`;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Demo payment successful!",
      order,
    });
  } catch (error) {
    console.error("Mock payment failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process demo payment.",
    });
  }
});

// GET: Fetch orders (customers see their own, admins see all)
router.get("/", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { userId: req.user._id };

    const orders = await Order.find(filter).sort({ createdAt: -1 });

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
});


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
