const moment = require('moment');
exports.isUsedCoupon = async options => {
  const coupon = options.couponId instanceof DB.Coupon ? options.couponId : await DB.Coupon.findOne({ _id: options.couponId });
  // const coupon = await DB.Coupon.findOne({ _id: options.couponId });
  if (!coupon) {
    throw new Error('Coupon not found');
  }
  const query = {
    userId: options.userId,
    couponCode: coupon.code,
    paid: true,
    tutorId: coupon.tutorId,
    targetType: coupon.targetType
  };

  if (coupon.targetType === 'course') query.targetId = coupon.courseId;
  if (coupon.targetType === 'webinar') query.targetId = coupon.webinarId;

  const count = await DB.Transaction.count(query);

  return count > 0;
};

exports.calculate = async options => {
  const coupon = options.couponId instanceof DB.Coupon ? options.couponId : await DB.Coupon.findOne({ _id: options.couponId });
  if (!coupon) {
    throw new Error('Coupon not found');
  }
  const dataDiscount = {};
  if (coupon.type === 'percent') {
    dataDiscount.discountAmount = options.price * (coupon.value / 100);
    dataDiscount.discountPrice = options.price - options.price * (coupon.value / 100);
  } else {
    dataDiscount.discountAmount = coupon.value;
    dataDiscount.discountPrice = options.price - coupon.value;
  }
  return dataDiscount;
};

exports.checkExistCode = async (code, tutorId, couponId = null) => {
  try {
    const query = { code, tutorId };
    if (couponId) {
      query._id = {
        $nin: [couponId]
      };
    }
    const count = await DB.Coupon.count(query);
    return count > 0;
  } catch (error) {
    throw e;
  }
};

exports.getValidCoupon = async (
  userId,
  options = {
    code: '',
    targetId: '',
    tutorId: '',
    targetType: ''
  }
) => {
  try {
    const coupon = await DB.Coupon.findOne({ code: options.code, tutorId: options.tutorId });
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    let targetId = coupon.tutorId;
    switch (coupon.targetType) {
      case 'course':
        targetId = coupon.courseId;
        break;
      case 'webinar':
        targetId = coupon.webinarId;
        break;
      default:
        break;
    }
    if (
      (coupon.targetType !== 'all' && targetId.toString() !== options.targetId.toString()) ||
      (coupon.targetType === 'all' && targetId.toString() !== options.tutorId.toString())
    ) {
      throw new Error('Invalid coupon');
    }
    const count = await DB.Transaction.count({
      couponCode: coupon.code,
      paid: true,
      tutorId: coupon.tutorId
    });

    if (count >= coupon.limitNumberOfUse) {
      throw new Error('Coupon has expired');
    }

    if (moment().isAfter(moment(coupon.expiredDate)) || moment().isBefore(moment(coupon.startTime))) {
      throw new Error('Coupon has expired');
    }

    const used = await DB.Transaction.count({
      couponCode: coupon.code,
      paid: true,
      tutorId: coupon.tutorId,
      userId
    });

    if (used) {
      throw new Error('You can only use this code once');
    }
    return coupon;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
