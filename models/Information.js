const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const informationSchema = new Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true, unique: true }, // Unique filename from multer
  path: { type: String, required: true }, // Path on the server
  mimeType: { type: String },
  size: { type: Number },
  keywords: [{ type: String }], // Array of strings for keywords
  category: { type: String },
  description: { type: String },
  extractedText: { type: String }, // PDF က စာသားတွေ သိမ်းဖို့ Field အသစ်
  uploadDate: { type: Date, default: Date.now } // Upload လုပ်တဲ့အချိန်
}, { timestamps: true }); // createdAt and updatedAt ကို အလိုအလျောက် ထည့်ပေးမယ်

// Search အတွက် text index ဖန်တီးပါ
// default_language ကို 'none' လို့ သတ်မှတ်ပြီး ဘာသာစကား သီးသန့် စည်းမျဉ်းတွေ မသုံးခိုင်းတော့ပါ
informationSchema.index({
    originalName: 'text',
    description: 'text',
    keywords: 'text',
    extractedText: 'text'
}, {
    default_language: 'none' // <-- ဒီ option ကို ထပ်ထည့်ပါ
});


const Information = mongoose.model('Information', informationSchema);

module.exports = Information;