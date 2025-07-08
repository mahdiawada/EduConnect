import { Router } from "express";
import UserRoutes from "./user.route";

const routes = Router();

routes.use('/users', UserRoutes);

export default routes;