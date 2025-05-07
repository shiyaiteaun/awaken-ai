const express = require('express');
const router = express.Router();
// const crypto = require('crypto'); // မလိုအပ်တော့ပါ
const User = require('../models/User'); // User model ကို import လုပ်ပါ
// const { sendVerificationEmail } = require('../utils/mailer'); // မလိုအပ်တော့ပါ

// POST /api/auth/register - User အသစ် Register လုပ်ရန် (Verification မပါ)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // --- Input Validation ---
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  // Email format validation (ယေဘုယျ)
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Please use a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }
  // --- End Validation ---

  try {
    let user = await User.findOne({ email });

    // User ရှိပြီးသားဆိုရင် error ပြန်ပါ
    if (user) {
      // မှတ်ချက်: ယခင်က verify မဖြစ်သေးရင် update လုပ်တဲ့ logic ရှိခဲ့ပေမယ့်၊
      // အခု verification မပါတော့တဲ့အတွက် ရှိပြီးသား email ဆို တန်း error ပြန်ပါမယ်။
      return res.status(400).json({ message: 'This email address is already registered.' });
    }

    // User အသစ်ဖန်တီးပါ (Verification fields မပါ)
    user = new User({
      email,
      password
      // isVerified: true // လိုအပ်ရင် default အနေနဲ့ true ထားနိုင်ပါတယ် (Model မှာ မပါရင် ဒီမှာထည့်စရာမလို)
    });

    console.log(`[Auth Route] Attempting to save new user: ${email}`);
    await user.save(); // Save the new user (triggers pre-save hook for password hashing)
    console.log(`[Auth Route] New user saved successfully: ${email}`);

    // --- Email ပို့ခြင်းနှင့် Verification Logic ဖယ်ရှားပြီး ---

    // အောင်မြင်ကြောင်း response ပြန်ပါ
    res.status(201).json({ message: 'Registration successful! You can now log in.' }); // Status 201 Created သုံးပါ

  } catch (error) {
    console.error('[Auth Route] Registration Error:', error);
    // Database error (e.g., duplicate email - findOne နဲ့ စစ်ပြီးသားမို့ ဒီကိုရောက်ခဲပေမယ့် ထားသင့်ပါတယ်)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email address is already in use.' });
    }
    // တခြား Server error များ
    res.status(500).json({ message: 'An error occurred on the server during registration. Please try again.' });
  }
});

// --- /api/auth/register/verify route ကို လုံးဝဖယ်ရှားလိုက်ပါ ---
// router.post('/register/verify', ...); // ဒီအပိုင်းတစ်ခုလုံးကို ဖျက်ပါ

// Login endpoint ကို ဒီနေရာမှာ ထပ်ထည့်နိုင်ပါတယ် (/api/auth/login)
// router.post('/login', async (req, res) => { ... });

// POST /api/auth/login - User Login လုပ်ရန်
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  try {
    // 1. User ကို email နဲ့ ရှာပါ၊ password ကိုပါ တကူးတက select လုပ်ပါ
    const user = await User.findOne({ email }).select('+password');

    // 2. User မတွေ့ရင် ဒါမှမဟုတ် password မှားရင် တူညီတဲ့ error message ပြပါ
    if (!user) {
      // console.log(`Login attempt failed: User not found for email ${email}`); // Debugging အတွက်
      return res.status(401).json({ message: 'Invalid credentials' }); // Generic message သုံးပါ
    }

    // 3. Password မှန်မမှန် စစ်ဆေးပါ (User model ထဲက matchPassword method ကို သုံးပါ)
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // console.log(`Login attempt failed: Password mismatch for email ${email}`); // Debugging အတွက်
      return res.status(401).json({ message: 'Invalid credentials' }); // Generic message သုံးပါ
    }

    // --- Login အောင်မြင်ပါက ---
    console.log(`[Auth Route] Login successful for user: ${email}`);

    // ဒီနေရာမှာ JWT token generate လုပ်တာ၊ session ဖန်တီးတာ စတာတွေ လုပ်နိုင်ပါတယ်
    // ဥပမာ JWT:
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // res.status(200).json({
    //   message: 'Login successful!',
    //   token: token, // Token ကို frontend ကို ပြန်ပို့ပါ
    //   user: { // လိုအပ်ရင် user အချက်အလက်တချို့ ပြန်ပို့နိုင်ပါတယ်
    //     id: user._id,
    //     email: user.email
    //   }
    // });

    // လောလောဆယ် အောင်မြင်ကြောင်း message ပဲ ပြန်ပါမယ်
    res.status(200).json({ message: 'Login successful!' });


  } catch (error) {
    console.error('[Auth Route] Login Error:', error);
    res.status(500).json({ message: 'An error occurred on the server during login. Please try again.' });
  }
});


module.exports = router;