import sys

# ============================================
# FIX 1: schedule.controller.js
# - Add bookedRanges[] for partial booking support
# - Change booked detection from exact-match to overlap
# - Fix 30-min buffer to only disable past slots
# ============================================
filepath1 = '/home/ubuntu/expertbridge/api/server/module/webinar/controllers/schedule.controller.js'
with open(filepath1, 'r') as f:
    content1 = f.read()

# Backup
with open(filepath1 + '.backup.flex.20260220', 'w') as f:
    f.write(content1)

old_mapping = """        const data = item.toObject();
        if (moment.utc().add(30, 'minutes').isAfter(moment.utc(data.startTime))) {
          data.disable = true;
        } else {
          data.disable = false;
        }
        data.booked = false;
        if (item.type === 'webinar') {
          const countBooked = await DB.Transaction.count({ slotId: item._id, paid: true });
          const webinar = await DB.Webinar.findOne({ _id: item.webinarId });
          data.webinarName = (webinar && webinar.name) || '';
          if (countBooked) {
            data.booked = true;
          }
        } else if (item.type === 'subject') {
          const countBooked = await DB.Appointment.count({
            startTime: moment(item.startTime).toDate(),
            toTime: moment(item.toTime).toDate(),
            paid: true,
            status: {
              $in: ['progressing', 'booked', 'pending', 'completed']
            },
            targetType: {
              $ne: 'webinar'
            },
            tutorId: query.tutorId
          });
          if (countBooked) {
            data.booked = true;
          }
        }
        return data;"""

new_mapping = """        const data = item.toObject();
        if (moment.utc().isAfter(moment.utc(data.toTime))) {
          data.disable = true;
        } else {
          data.disable = false;
        }
        data.booked = false;
        data.bookedRanges = [];
        if (item.type === 'webinar') {
          const countBooked = await DB.Transaction.count({ slotId: item._id, paid: true });
          const webinar = await DB.Webinar.findOne({ _id: item.webinarId });
          data.webinarName = (webinar && webinar.name) || '';
          if (countBooked) {
            data.booked = true;
          }
        } else if (item.type === 'subject') {
          const overlappingAppointments = await DB.Appointment.find({
            tutorId: query.tutorId,
            targetType: { $ne: 'webinar' },
            status: { $in: ['progressing', 'booked', 'pending', 'completed'] },
            paid: true,
            startTime: { $lt: moment(item.toTime).toDate() },
            toTime: { $gt: moment(item.startTime).toDate() }
          }).select('startTime toTime').lean();

          if (overlappingAppointments.length > 0) {
            data.bookedRanges = overlappingAppointments.map(a => ({
              startTime: a.startTime,
              toTime: a.toTime
            }));
            const fullyBooked = overlappingAppointments.some(a =>
              moment(a.startTime).isSameOrBefore(moment(item.startTime)) &&
              moment(a.toTime).isSameOrAfter(moment(item.toTime))
            );
            data.booked = fullyBooked;
          }
        }
        return data;"""

if old_mapping in content1:
    content1 = content1.replace(old_mapping, new_mapping)
    with open(filepath1, 'w') as f:
        f.write(content1)
    print("FIX 1 APPLIED: schedule.controller.js")
else:
    print("WARNING: Could not find exact match in schedule.controller.js")

# ============================================
# FIX 2: Booking.js - Pro-rate pricing
# ============================================
filepath2 = '/home/ubuntu/expertbridge/api/server/module/booking/services/Booking.js'
with open(filepath2, 'r') as f:
    content2 = f.read()

with open(filepath2 + '.backup.flex.20260220', 'w') as f:
    f.write(content2)

# Fix create() method
old_price_create = """    const data = {
      appointmentId: appointment._id,
      name: `Book appointment with ${tutor.name}`,
      description: `${user.name} booking slot of ${subject.name} with ${tutor.name}`,
      price: subject.price || tutor.price1On1Class,"""

new_price_create = """    const bookingDurationHours = moment(options.toTime).diff(moment(options.startTime), 'minutes') / 60;
    const hourlyRate = subject.price || tutor.price1On1Class;
    const proRatedPrice = Math.round(hourlyRate * bookingDurationHours * 100) / 100;

    const data = {
      appointmentId: appointment._id,
      name: `Book appointment with ${tutor.name}`,
      description: `${user.name} booking slot of ${subject.name} with ${tutor.name}`,
      price: proRatedPrice,"""

if old_price_create in content2:
    content2 = content2.replace(old_price_create, new_price_create)
    print("FIX 2a APPLIED: Booking.js create() - pro-rated pricing")
else:
    print("WARNING: Could not find create() price pattern")

# Fix Razorpay payment call
old_rp = "  price: subject.price || tutor.price1On1Class,\n  name: `Book appointment with ${tutor.name}`,"
new_rp = "  price: proRatedPrice,\n  name: `Book appointment with ${tutor.name}`,"
if old_rp in content2:
    content2 = content2.replace(old_rp, new_rp)
    print("FIX 2b APPLIED: Booking.js razorpay price")
else:
    print("WARNING: Could not find razorpay price pattern")

# Fix checkout() method
old_checkout = "        let itemPrice = subject.price || tutor.price1On1Class;"
new_checkout = "        const checkoutDurationHours = (moment(time.toTime).diff(moment(time.startTime), 'minutes')) / 60;\n        let itemPrice = Math.round((subject.price || tutor.price1On1Class) * checkoutDurationHours * 100) / 100;"
if old_checkout in content2:
    content2 = content2.replace(old_checkout, new_checkout)
    print("FIX 2c APPLIED: Booking.js checkout() pro-rated")
else:
    print("WARNING: Could not find checkout price pattern")

# Fix coupon else branch
old_else = "          totalPrice += subject.price || tutor.price1On1Class;"
new_else = "          totalPrice += itemPrice;"
if old_else in content2:
    content2 = content2.replace(old_else, new_else)
    print("FIX 2d APPLIED: Booking.js coupon else branch")
else:
    print("WARNING: Could not find coupon else branch")

# Fix originalPrice
old_orig = "          originalPrice: subject.price || tutor.price1On1Class,"
new_orig = "          originalPrice: Math.round((subject.price || tutor.price1On1Class) * checkoutDurationHours * 100) / 100,"
if old_orig in content2:
    content2 = content2.replace(old_orig, new_orig)
    print("FIX 2e APPLIED: Booking.js originalPrice")
else:
    print("WARNING: Could not find originalPrice pattern")

# Fix coupon calculation
old_coupon = """            const dataDiscount = await Service.Coupon.calculate({
              price: subject.price || tutor.price1On1Class,"""
new_coupon = """            const dataDiscount = await Service.Coupon.calculate({
              price: itemPrice,"""
if old_coupon in content2:
    content2 = content2.replace(old_coupon, new_coupon)
    print("FIX 2f APPLIED: Booking.js coupon calc")
else:
    print("WARNING: Could not find coupon calc pattern")

with open(filepath2, 'w') as f:
    f.write(content2)

print("\nAll backend changes complete!")
