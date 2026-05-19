const mongoose = require('mongoose');

const DeviceTokenSchema = new mongoose.Schema(
  {
    userId:      { type: String, required: true },
    deviceToken: { type: String, required: true },
    platform:    { type: String, enum: ['android', 'ios'], required: true },
    language:    { type: String, default: 'en' },
    region:      { type: String, default: '' },
    cropTypes:   { type: [String], default: [] },
  },
  { timestamps: true },
);

// One user can have multiple devices; one token belongs to one user
DeviceTokenSchema.index({ userId: 1, deviceToken: 1 }, { unique: true });
DeviceTokenSchema.index({ deviceToken: 1 });
DeviceTokenSchema.index({ region: 1 });

module.exports = mongoose.model('DeviceToken', DeviceTokenSchema);
