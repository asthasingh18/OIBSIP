
const express = require("express");
const router = express.Router();

const Pizza = require("../models/Pizza");

// GET all pizzas
router.get("/", async (req, res) => {
  try {
    const pizzas = await Pizza.find();

    res.status(200).json({
      success: true,
      count: pizzas.length,
      pizzas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pizzas",
    });
  }
});

module.exports = router;
