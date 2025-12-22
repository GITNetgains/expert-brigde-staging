const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    name: {
      type: String
    },
    subject: {
      type: String
    },
    content: {
      type: String
    },
    description: {
      type: String
    },
    layout: {
      type: String,
      default: 'default'
    },
    key: {
      type: String
    },
    path: {
      type: String
    },
    group: {
      type: String
    },
    subject_replace_fields: [{ type: String }],
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
