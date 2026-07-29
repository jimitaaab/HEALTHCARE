import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  app_url: process.env.app_url,
  bcryptSaltRounds: process.env.bcrypt_salt_rounds,
  jwt_access_Secret: process.env.jwt_access_Secret!,
  jwt_refresh_Secret: process.env.jwt_refresh_Secret!,
  jwt_access_ExpiresIn: process.env.jwt_access_ExpiresIn!,
  jwt_refresh_ExpiresIn: process.env.jwt_refresh_ExpiresIn!,
};