import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";

export const createCheckout = async (req: AuthRequest, res: Response) => {
  // TODO: Create Stripe/Razorpay checkout session
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  // TODO: Verify payment and upgrade user plan
};

export const getSubscription = async (req: AuthRequest, res: Response) => {
  // TODO: Get current subscription status and usage
};
