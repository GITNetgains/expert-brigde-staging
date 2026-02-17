const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    type: { type: String, enum: ['student', 'tutor'], required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = schema;
