const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\S+@\S+\.\S+$/, // Basic email format validation
      'Please provide a valid email address'
    ],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  // --- ဒီနေရာတစ်ဝိုက်မှာ username ဆိုတဲ့ field ပါနေသလား စစ်ဆေးပါ ---
  // username: {
  //   type: String,
  //   unique: true, // unique: true ပါနေရင် ဒါက ပြဿနာပါ
  //   sparse: true // sparse: true ထည့်ရင် null တွေကို unique မစစ်တော့ပါ (ဒါပေမယ့် username မသုံးရင် ဖယ်တာ ပိုကောင်းပါတယ်)
  // },
  // --- စစ်ဆေးရန် ပြီးဆုံး ---
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password ကို save မလုပ်ခင် hash လုပ်ပါ
UserSchema.pre('save', async function(next) {
  // Password မပြောင်းရင် ဆက်မလုပ်ပါ
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Salt generate လုပ်ပြီး password ကို hash လုပ်ပါ
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Error ကို middleware chain ဆီ ပို့ပါ
  }
});

// Password မှန်မမှန် စစ်ဆေးတဲ့ method (login အတွက်)
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);