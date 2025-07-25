import { Router } from "express";
import { AuthenticationController } from "../controllers/auth.controller";
import { AuthenticationService } from "../services/Authentication.service";
import { UserService } from "../services/User.service";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authenticate } from "../middlewares/auth";

const router = Router();

const authService = new AuthenticationService();
const userService = new UserService();

const authController = new AuthenticationController(authService, userService);

router.route('/login')
    .post(asyncHandler(authController.login.bind(authController)));

router.route('/logout')
    .post(authenticate, asyncHandler(authController.logout.bind(authController)));

export default router;