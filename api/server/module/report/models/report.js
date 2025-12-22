const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    targetId: {
      type: Schema.Types.ObjectId
    },
    targetCode: {
      type: String
    },
    transactionId: {
      type: Schema.Types.ObjectId
    },
    transactionCode: { type: String },
    reportByUserId: {
      type: Schema.Types.ObjectId
    },
    reportToUserId: {
      type: Schema.Types.ObjectId
    },
    targetType: {
      type: String,
      enum: ['system', 'tutor', 'webinar', 'subject', 'topic']
    },
    status: {
      type: String,
      enum: ['progressing', 'approved', 'rejected'],
      default: 'progressing'
    },
    issue: { type: String },
    note: {
      type: String
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {
        reportBy: '',
        reportTo: ''
      }
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
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

module.exports = schema;
