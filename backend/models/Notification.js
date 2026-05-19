const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId:  { type: String, required: true, index: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    type:    {
      type: String,
      enum: ['weather', 'market', 'disease', 'scheme', 'rain', 'crop', 'general'],
      default: 'general',
    },
    screen:  { type: String, default: null },   // deep link screen name
    data:    { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead:  { type: Boolean, default: false },
    sentAt:  { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Notification', NotificationSchema);
