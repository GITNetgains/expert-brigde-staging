/* eslint prefer-arrow-callback: 0 */
const _ = require('lodash');
const mongoose = require('mongoose');

exports.User = schema => {
  schema.add({
    avatar: { type: String, default: '' },
    emailVerifiedToken: {
      type: String,
      index: true
    },
    type: {
      type: String,
      default: 'user',
      index: true
    },
    passwordResetToken: { type: String, index: true },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    phoneNumber: { type: String, default: '', index: true },
    phoneVerified: { type: Boolean, default: false },
    address: { type: String, default: '' },
    notificationSettings: { type: Boolean, default: true },
    paypalEmailId: { type: String, lowercase: true, default: '' },
    timezone: { type: String, default: '' },
    gender: { type: String, default: '' },
    country: { type: mongoose.Schema.Types.Mixed },
    countryCode: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    lessonSpaceUserId: { type: Number, default: '' },
    lessonSpaceUserInfo: { type: mongoose.Schema.Types.Mixed },
   aiQueries: [
  {
    query: { type: String },
    description: { type: String },

    aiAttachmentIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Media' }
    ],

    assignedTutors: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],

    createdAt: { type: Date, default: Date.now }
  }
],


  
    // ----------------------------
    skillIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        index: true
      }
    ]

    ,
    industryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Industry',
        index: true
      }
    ]

  });

  // --- NEW VIRTUAL ADDED HERE ---
  // This allows you to call user.populate('industries') to get the names/details

  // ------------------------------
  schema.virtual('skills', {
    ref: 'Skill',
    localField: 'skillIds',
    foreignField: '_id',
    justOne: false
  });

  schema.virtual('industries', {
    ref: 'Industry',
    localField: 'industryIds',
    foreignField: '_id',
    justOne: false
  });


  schema.method('toJSON', function toJSON() {
    const user = this.toObject();
    user.avatarUrl = DB.User.getAvatarUrl(user.avatar);
    return _.omit(user, ['password', 'emailVerifiedToken', 'passwordResetToken', 'salt', 'avatar']);
  });

  schema.virtual('avatarUrl').get(function avatarUrl() {
    return DB.User.getAvatarUrl(this.avatar);
  });

  schema.method('getPublicProfile', function getPublicProfile(toJSON = false) {
    const user = toJSON ? this.toJSON() : this.toObject();
    user.avatarUrl = DB.User.getAvatarUrl(user.avatarUrl);
    return _.omit(user, ['password', 'emailVerifiedToken', 'passwordResetToken', 'salt']);
  });

  schema.static('getAvatarUrl', function getAvatarUrl(filePath) {
    if (Helper.String.isUrl(filePath)) {
      return filePath;
    }
    const newFilePath = filePath || 'public/assets/default-avatar.jpg';
    return Helper.App.getPublicFileUrl(newFilePath);
  });
};
