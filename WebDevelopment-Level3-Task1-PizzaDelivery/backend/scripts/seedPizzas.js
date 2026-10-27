
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Pizza = require("../models/Pizza");

const samplePizzas = [
  {
    name: "Margherita",
    description: "Classic pizza with tomato sauce and mozzarella cheese.",
    price: 199,
    image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=600&q=80",
    category: "Veg",
    ingredients: ["Tomato Sauce", "Mozzarella", "Basil"],
  },
  {
    name: "Farmhouse",
    description: "Loaded with onion, capsicum, tomato, and cheese.",
    price: 299,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    category: "Veg",
    ingredients: ["Onion", "Capsicum", "Tomato", "Mozzarella"],
  },
  {
    name: "Paneer Tikka",
    description: "Spiced paneer with onions, peppers, and cheese.",
    price: 329,
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=600&q=80",
    category: "Veg",
    ingredients: ["Paneer", "Onion", "Capsicum", "Tikka Sauce"],
  },
  {
    name: "Chicken Supreme",
    description: "Chicken pieces with peppers and melted mozzarella.",
    price: 379,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    category: "Non-Veg",
    ingredients: ["Chicken", "Capsicum", "Mozzarella", "Tomato Sauce"],
  },
  
  {
    name: "BBQ Chicken",
    description: "Smoky barbecue sauce topped with grilled chicken, onions, and mozzarella.",
    price: 399,
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=600&q=80",
    category: "Non-Veg",
    ingredients: ["Grilled Chicken", "BBQ Sauce", "Onion", "Mozzarella"],
  },
  {
    name: "Mexican Green Wave",
    description: "A flavorful vegetarian pizza loaded with capsicum, jalapenos, onions, and cheese.",
    price: 349,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    category: "Veg",
    ingredients: ["Capsicum", "Jalapenos", "Onion", "Mozzarella", "Mexican Herbs"],
  },

];

const seedPizzas = async () => {
  try {
    await connectDB();

    await Pizza.deleteMany({});
    await Pizza.insertMany(samplePizzas);

    console.log("Sample pizzas added successfully!");
    console.log(`Total pizzas: ${samplePizzas.length}`);
  } catch (error) {
    console.error("Error seeding pizzas:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedPizzas();
