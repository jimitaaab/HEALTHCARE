 import dotenv from "dotenv";
import path from "path";

dotenv.config({path: path.join(process.cwd(),".env")});

export default {
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    app_url: process.env.APP_URL,
    bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt_access_Secret: process.env.JWT_ACCESS_SECRET!,
    jwt_refresh_Secret: process.env.JWT_REFRESH_SECRET!,
    jwt_access_ExpiresIn: process.env.JWT_ACCESS_EXPIRESIN!,
    jwt_refresh_ExpiresIn: process.env.JWT_REFRESH_EXPIRESIN!,
};