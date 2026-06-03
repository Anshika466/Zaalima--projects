const express = require('express');
const { protect, checkAccountStatus } = require('../middleware/auth');

const router = express.Router();

// Only load Stripe if key is present (graceful degradation)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;

/**
 * POST /api/payment/create-payment-intent
 * Creates a Stripe PaymentIntent for checkout.
 * @access Protected (logged-in customers)
 */
router.post(
  '/create-payment-intent',
  protect,
  checkAccountStatus,
  async (req, res) => {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please set STRIPE_SECRET_KEY.',
      });
    }

    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'A valid amount is required.',
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to paise (INR smallest unit)
        currency: 'inr',
        metadata: { userId: req.user._id.toString() },
      });

      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
