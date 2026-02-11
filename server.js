const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

/* ================= RAZORPAY ================= */

const razorpay = new Razorpay({
  key_id: "YOUR_RAZORPAY_KEY",
  key_secret: "YOUR_RAZORPAY_SECRET"
});

/* ================= EMAIL SETUP ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourgmail@gmail.com",
    pass: "YOUR_GMAIL_APP_PASSWORD"
  }
});

/* ================= WHATSAPP SETUP (TWILIO) ================= */

// const client = twilio(
//   "YOUR_TWILIO_ACCOUNT_SID",
//   "YOUR_TWILIO_AUTH_TOKEN"
// );


/* ================= SAVE BOOKING + SEND NOTIFICATIONS ================= */

app.post("/book", async (req, res) => {
  const booking = req.body;

  let bookings = [];
  if (fs.existsSync("bookings.json")) {
    bookings = JSON.parse(fs.readFileSync("bookings.json"));
  }

  bookings.push(booking);
  fs.writeFileSync("bookings.json", JSON.stringify(bookings, null, 2));

  /* ===== SEND EMAIL ===== */
  await transporter.sendMail({
    from: "yourgmail@gmail.com",
    to: "yourgmail@gmail.com",
    subject: "New Event Booking 🎉",
    text: `
New Booking Received:

Name: ${booking.name}
Phone: ${booking.phone}
Date: ${booking.date}
Event: ${booking.event}
    `
  });

/* ===== SEND WHATSAPP MESSAGE DISABLED FOR NOW ===== */
// await client.messages.create({
//   body: `New Booking 🎉
// Name: ${booking.name}
// Phone: ${booking.phone}
// Date: ${booking.date}
// Event: ${booking.event}`,
//   from: "whatsapp:+14155238886",
//   to: "whatsapp:+91YOURNUMBER"
// });

  res.json({ status: "Booking saved, Email & WhatsApp sent!" });
});

/* ================= CREATE PAYMENT ORDER ================= */

app.post("/create-order", async (req, res) => {
  const options = {
    amount: req.body.amount * 100,
    currency: "INR",
    receipt: "receipt_order"
  };

  const order = await razorpay.orders.create(options);
  res.json(order);
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
