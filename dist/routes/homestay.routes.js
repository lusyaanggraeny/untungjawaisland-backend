"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const homestay_controller_1 = require("../controllers/homestay.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Public routes
router.get('/', homestay_controller_1.getAllHomestays);
router.get('/:id', homestay_controller_1.getHomestayById);
// Protected routes (require authentication)
router.post('/', auth_middleware_1.authenticateToken, homestay_controller_1.createHomestay);
router.put('/:id', auth_middleware_1.authenticateToken, homestay_controller_1.updateHomestay);
router.delete('/:id', auth_middleware_1.authenticateToken, homestay_controller_1.deleteHomestay);
// New route for adding an image to a specific homestay
router.post('/:homestayId/images', auth_middleware_1.authenticateToken, homestay_controller_1.addHomestayImage);
exports.default = router;
