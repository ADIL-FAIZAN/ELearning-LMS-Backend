"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
router.post("/new-payment", async (req, res, next) => {
    const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "USD",
        metadata: {
            company: "ELearning",
        },
        automatic_payment_methods: {
            enabled: true,
        }
    });
    res.status(201).json({ success: true, client_secret: myPayment.client_secret });
});
router.get("/stripe-Publishable-Api-Key", async (req, res, next) => {
    res.status(200).json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});
module.exports = router;
//# sourceMappingURL=Payment.Controller.js.map