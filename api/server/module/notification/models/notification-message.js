const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification'
    },
    text: { type: String, default: '' },
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
