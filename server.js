const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const admin = require("firebase-admin");
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

let alerts = [];
let userTokens = {}; // userId -> token

// 📱 РЕЄСТРАЦІЯ TOKEN
app.post("/register-token", (req, res) => {
  const { userId, token } = req.body;

  userTokens[userId] = token;

  console.log("📱 Token saved:", userId, token);

  res.send({ success: true });
});

// 🚨 ОТРИМАТИ АЛЕРТИ (для polling)
app.get("/alerts", (req, res) => {
  res.send(alerts);
});

// 🔔 ФУНКЦІЯ PUSH
async function sendPush(token, message) {
  try {
    await admin.messaging().send({
      token: token,
      notification: {
        title: "🚨 ТРИВОГА",
        body: message,
      },
    });

    console.log("✅ Push sent");
  } catch (e) {
    console.log("❌ Push error:", e);
  }
}

// 🚨 СТВОРИТИ ALERT
app.post("/alert", async (req, res) => {
  const { message } = req.body;

  const alert = {
  id: Date.now(),
  message,
  users: [1],
};

  alerts.push(alert);

  console.log("🚨 ALERT:", message);

  // 🔥 ВІДПРАВЛЯЄМО PUSH ВСІМ
  Object.values(userTokens).forEach((token) => {
    sendPush(token, message);
  });

  res.send({ success: true });
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});