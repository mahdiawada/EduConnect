import { UserController } from "../controllers/user.controller";
import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { UserService } from "../services/User.service";

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

router.route('/')
.get(asyncHandler(userController.getAllUsers.bind(userController)))
.post(asyncHandler(userController.createUser.bind(userController)));

router.route('/:id')
.get(asyncHandler(userController.getUserById.bind(userController)))
.put(asyncHandler(userController.updateUser.bind(userController)))
.delete(asyncHandler(userController.deleteUser.bind(userController)))

export default router;