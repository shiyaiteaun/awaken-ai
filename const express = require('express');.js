const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Frontend နဲ့ ချိတ်ဆက်ဖို့

require('dotenv').config(); // Environment variables အတွက်

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // JSON request body တွေကို parse လုပ်ဖို့

// --- MongoDB Connection ---
const uri = process.env.MONGODB_URI; // .env file ထဲမှာ MONGODB_URI ကိုထည့်ပါ
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})
.on('error', (err) => {
  console.error("MongoDB connection error:", err);
});

// --- Basic Route ---
app.get('/', (req, res) => {
  res.send('AI Web App Backend is running!');
});

// --- API Routes (နောက်မှ ထပ်ဖြည့်ပါမယ်) ---
// const informationRouter = require('./routes/information');
// const searchRouter = require('./routes/search');
// app.use('/api/information', informationRouter);
// app.use('/api/search', searchRouter);


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});