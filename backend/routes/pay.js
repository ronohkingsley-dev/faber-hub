// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/pay.js
// ══════════════════════════════════════════════════════
const router = require('express').Router();
const Flutterwave = require('flutterwave-node-v3');
const authenticate = require('../middleware/auth');

const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY || 'FLWPUBK_TEST-DEMO-KEY';
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-DEMO-KEY';

const flw = new Flutterwave(FLW_PUBLIC_KEY, FLW_SECRET_KEY);

router.post('/', authenticate, async (req, res) => {
  try {
    const payload = {
      phone_number: req.body.phone_number || "0700000000",
      amount: req.body.amount,
      currency: "KES",
      email: req.user.email,
      tx_ref: "tx-" + Date.now(),
      network: "SAFARICOM"
    };

    const response = await flw.MobileMoney.kenya(payload);
    res.json(response);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhook', (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH || '';
  const signature = req.headers['verif-hash'];
  
  // Security checks for production go here
  if (!signature || signature !== secretHash) {
    // console.warn("Invalid webhook signature");
  }

  const payload = req.body;
  if (payload.status === "successful") {
    // trigger LIPA_MPESA success integration
    console.log("Flutterwave Webhook received successful payment:", payload.tx_ref);
  }
  
  res.status(200).end();
});

module.exports = router;
