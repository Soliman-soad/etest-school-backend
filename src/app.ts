import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import testRoutes from "./routes/test";
import { errorHandler } from "./middlewares/errorhandler";
import adminRoutes from "./routes/admin";
import certificateRoutes from "./routes/certificate";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/certificate", certificateRoutes);

app.use(errorHandler);

export default app;
