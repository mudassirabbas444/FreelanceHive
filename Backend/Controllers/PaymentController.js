const Order = require("../Models/Order");
const Payment=require("../Models/Payment");

exports.createPayment=async (req, res)=>{
    try{
    
        const { amount, currency, gigId, buyerId, sellerId, orderId } = req.body;
    
        if (!amount || !currency || !gigId || !buyerId || !sellerId || !orderId) {
          console.error('Missing required fields:', { amount, currency, gigId, buyerId, sellerId, orderId });
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
            orderId
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });
    
        const paymentData=new Payment(req.body);
        const paymentId=await Payment.createPayment(paymentData);
        res.status(201).json({message: "Payment created successfully", paymentId});
        res.json({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
      
        res.status(500).json({ 
          error: error.message,
          details: error
        });
      }
   
    }


exports.getPayments=async (req, res)=>{
   try{
    const {status}=req.body;
    const filter=status && status!==All?{status}:{};
    const allpayments=await Payment.getPayments(filter);
    if(!allpayments.length){
        res.status(404).json({message:"No payment found"})
    }
    res.json(allpayments);

   }
   catch(err){
     res.status(500).json({error:err.message});
   }


}