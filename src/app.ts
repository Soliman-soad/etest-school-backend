import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import { errorHandler } from "./middlewares/errorhandler";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;
