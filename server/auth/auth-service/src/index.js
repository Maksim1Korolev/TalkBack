import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import authRoutes from "./auth/auth.routes.js";
import usersRoutes from "./users/users.routes.js";

import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

async function main() {
  app.use(cors());
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 3010;

  app.listen(PORT, () => {
    console.log(
      `auth-service is running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
}

main()
  .then(async () => {})
  .catch(async err => {
    console.error(err.message);
    process.exit(1);
  });
