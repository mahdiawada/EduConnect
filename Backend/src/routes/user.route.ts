import { UserController } from "../controllers/user.controller";
import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { UserService } from "../services/User.service";
import { authenticate } from "../middlewares/auth";

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

router.route('/')
.get(authenticate, asyncHandler(userController.getAllUsers.bind(userController)))
.post(asyncHandler(userController.createUser.bind(userController)));

router.route('/:id')
.get(authenticate, asyncHandler(userController.getUserById.bind(userController)))
.put(authenticate,asyncHandler(userController.updateUser.bind(userController)))
.delete(authenticate, asyncHandler(userController.deleteUser.bind(userController)))

export default router;