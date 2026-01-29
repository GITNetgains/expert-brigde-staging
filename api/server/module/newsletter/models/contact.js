const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    name: {
      type: String
    },

    companyName: {
      type: String
    },

    email: {
  type: String,
  index: true,
  lowercase: true,
  trim: true
},

phoneNumber: {
  type: String,
  trim: true
},

    message: {
      type: String
    },

    // keep this if used elsewhere
    address: {
      type: String
    }
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    }
  }
);

module.exports = schema;
