import { Router } from "express";
import { createCheckout, verifyPayment, getSubscription } from "./payment.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.post("/checkout", authenticate, createCheckout);
router.post("/verify", authenticate, verifyPayment);
router.get("/subscription", authenticate, getSubscription);

export default router;
