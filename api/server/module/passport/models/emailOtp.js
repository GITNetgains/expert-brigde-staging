/* eslint prefer-arrow-callback: 0 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['student', 'tutor'],
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL auto delete
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate OTPs
schema.index({ email: 1, otp: 1 });

module.exports = schema;
