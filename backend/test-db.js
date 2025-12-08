require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
console.log("Testing connection to:", uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(uri)
  .then(() => {
    console.log("Successfully connected to MongoDB!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection failed:", err.message);
    process.exit(1);
  });
