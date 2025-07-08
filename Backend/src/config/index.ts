import dotenv from "dotenv";
import path from "path";


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
    database: process.env.DATABASE
}