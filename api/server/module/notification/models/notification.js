const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    notifyTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    itemId: {
      type: Schema.Types.ObjectId
    },
    type: {
      type: String,
      default: '',
      enum: ['payment', 'payout', 'refund', 'booking', 'course', 'webinar', 'message', 'my-course']
    },
    unreadNotification: {
      type: Number,
      default: 0
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

schema.virtual('lastMessage', {
  ref: 'NotificationMessage',
  localField: 'lastMessageId',
  foreignField: '_id',
  justOne: true
});

module.exports = schema;
