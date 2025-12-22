const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String
    },
    alias: {
      type: String,
      index: true
    },
    type: {
      type: String,
      enum: ['high-school', 'middle-school', 'elementary', 'college'],
      default: 'elementary'
    },
    ordering: {
      type: Number,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = schema;
