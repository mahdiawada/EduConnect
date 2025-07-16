import dotenv from "dotenv";
import path from "path";
import { StringValue } from "ms";

dotenv.config({path: path.join(__dirname, '../../.env')})

export default {
    logDir: process.env.LOG_DIR || "./logs",
    isDev: process.env.NODE_ENV === "development",
    storagePath: {},
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: process.env.HOST || 'localhost',
    user: process.env.USER,
    db_port: process.env.DBPORT ? parseInt(process.env.DBPORT) : 5432,
    password: process.env.DBPASSWORD,
    database: process.env.DATABASE,
    auth: {
        secretKey: process.env.JWY_SECRET_KEY || "secret_1234567890",
        tokenExpiration: (process.env.TOKEN_EXPIRATION || "1h") as StringValue
    },
    nodemailer: {
        gmail_app_pass: process.env.GMAIL_APP_PASSWORD,
        gmail_account: process.env.GMAIL_ACCOUNT
    }
}