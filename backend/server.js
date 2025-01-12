import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./db/db.js";

const app = express();
dotenv.config();

app.use(
  cors({
    origin: ["http://localhost:5173/"],
    methods: ["POST"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res, next)=>{return res.status(200).json({
  success: true,
  message: "HELLO WORLD AGAIN"
})})

connectDB();


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});