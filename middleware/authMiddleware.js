const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User model ကို import လုပ်ပါ
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key_for_testing'; // server.js မှာ သုံးခဲ့တဲ့ secret key နဲ့ တူရပါမယ်

const protect = async (req, res, next) => {
    let token;

    // Request header ထဲက Authorization မှာ token ပါလား စစ်ဆေးပါ (Bearer token format)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 'Bearer ' ဆိုတဲ့ စာသားကို ဖယ်ပြီး token ကို ထုတ်ယူပါ
            token = req.headers.authorization.split(' ')[1];

            // Token ကို verify လုပ်ပါ
            const decoded = jwt.verify(token, JWT_SECRET);

            // Token ထဲက userId ကိုသုံးပြီး user အချက်အလက်ကို DB ကနေ ရှာပါ (password မပါစေနဲ့)
            // req.user မှာ user အချက်အလက်ကို ထည့်ပေးလိုက်ရင် နောက်ပိုင်း route တွေမှာ သုံးနိုင်ပါပြီ
            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {
                // User မတွေ့ရင် (ဥပမာ token မှန်ပေမယ့် user ကို ဖျက်လိုက်ရင်)
               return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // အောင်မြင်ရင် နောက် middleware သို့မဟုတ် route handler ကို ဆက်သွားခိုင်းပါ

        } catch (error) {
            console.error('Token verification failed:', error.message);
            // Token verify မအောင်မြင်ရင် (invalid token, expired token)
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // Header မှာ token မပါရင်
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };