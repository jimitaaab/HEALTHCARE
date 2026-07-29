import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import config from "./config";
import cors from "cors";
import { userRoutes } from "./modules/users/user.route";
import { doctorRoutes } from "./modules/doctors/doctor.route";
import errorHandler from "./middleware/error.middleware";

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
app.use("/api/v1/doctors", doctorRoutes);

app.use(errorHandler);

export default app;
