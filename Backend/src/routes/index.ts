import { Router } from "express";
import UserRoutes from "./user.route";
import AuthRoutes from "./auth.route";
import RoomRoutes from "./room.route";
import ChatRoutes from "./chat.route";
import { authenticate } from "../middlewares/auth";

const routes = Router();

routes.use('/users', UserRoutes);
routes.use('/auth', AuthRoutes);
routes.use('/rooms',authenticate, RoomRoutes);
routes.use('/chats', authenticate, ChatRoutes);

export default routes;