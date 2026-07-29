import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import config from "./config";
import cors from "cors";
import httpStatus from "http-status-codes";
import { userRoutes } from "./modules/users/user.route";
import { authRoutes } from "./modules/auth/auth.route";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    message: err.message || "Internal server error",
  });
});

export default app;
