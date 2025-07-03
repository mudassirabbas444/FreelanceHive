const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51RFQzsFGXfJNzhXiTrwzOOxAUSZPGsr4GG2ydeJm5eYrRYVY2xo0j9f5vvypA0YituPZ9El98pL6aVuYz8I3P4fk00py4nMbFm');

// Create payment intent
router.post('/payment/create-payment-intent', async (req, res) => {
  try {
    console.log('Received payment intent request:', req.body);
    
    const { amount, currency, gigId, buyerId, sellerId, packageId } = req.body;

    if (!amount || !currency || !gigId || !buyerId || !sellerId || !packageId) {
      console.error('Missing required fields:', { amount, currency, gigId, buyerId, sellerId, packageId });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        gigId,
        buyerId,
        sellerId,
        packageId
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: error.message,
      details: error
    });
  }
});

module.exports = router; 