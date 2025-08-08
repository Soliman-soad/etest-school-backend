import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import app from "./app";

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
