const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    title: {
      type: String
    },
    organization: {
      type: String   // ✅ NEW FIELD
    },
    description: {
      type: String
    },
    fromYear: {
      type: Number
    },
    toYear: {
      type: Number
    },
    type: {
      type: String,
      enum: ['education', 'experience', 'certification'],
      default: ''
    },
    verified: {
      type: Boolean,
      default: false
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Media'
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    ordering: {
      type: Number,
      index: true
    },
    createdAt: {
      type: Date
    },
    updatedAt: {
      type: Date
    }
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = schema;
