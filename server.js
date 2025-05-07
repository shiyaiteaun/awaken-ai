require('dotenv').config(); // .env ဖိုင်သုံးရန် (လိုအပ်ပါက)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Database connection function ကို import လုပ်ပါ (ရှိခဲ့လျှင်)
// const connectDB = require('./config/db'); // သင့် path အတိုင်း ပြင်ပါ

// Route files တွေကို import လုပ်ပါ
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai'); // <-- ဒီ line ပါနေရပါမယ်
// တခြား routes တွေရှိရင် ဒီမှာ import လုပ်ပါ (e.g., const postRoutes = require('./routes/posts');)

// --- Database Connection ---
// connectDB(); // Database connection function ကို ခေါ်ပါ (သို့မဟုတ်)
// mongoose.connect(process.env.MONGO_URI, { // <-- ဒီ line ကို ပြင်ပါ
mongoose.connect(process.env.MONGODB_URI, { // <-- MONGODB_URI လို့ ပြောင်းပါ
  // useNewUrlParser: true, // Deprecated - မထည့်လည်းရပါပြီ
  // useUnifiedTopology: true // Deprecated - မထည့်လည်းရပါပြီ
})
.then(() => console.log('MongoDB Connected Successfully!'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1); // Connection မရရင် server ကို ရပ်ပါ
});
// --- End Database Connection ---


const app = express();

// --- Middleware ---
// CORS ကို အရင် enable လုပ်ပါ
app.use(cors({
  origin: 'http://localhost:3000', // React app ရဲ့ URL ကို ခွင့်ပြုပါ
  credentials: true // လိုအပ်ပါက
}));

// Request body (JSON) ကို parse လုပ်ရန်
app.use(express.json());
// --- End Middleware ---


// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes); // <-- ဒီ line လည်း ပါနေရပါမယ်

// Default route (optional)
app.get('/', (req, res) => {
  res.send('API is running...');
});
// --- End Routes ---


// --- Error Handling Middleware (JSON response အတွက်) ---
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message || err);
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred.',
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // Development မှာ stack trace ပြရန်
  });
});
// --- End Error Handling ---


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running successfully on port ${PORT}`));

// Handle unhandled promise rejections (Optional but Recommended)
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});