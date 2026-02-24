const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/new_expert_bridge');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  const subjects = await db.collection('mysubjects').find({}).project({name: 1, price: 1, tutorId: 1}).toArray();
  console.log('=== MY SUBJECTS (prices) ===');
  subjects.forEach(s => console.log(JSON.stringify(s)));
  
  const tutors = await db.collection('users').find({type: 'tutor', verified: true}).project({name: 1, price1On1Class: 1, defaultSlotDuration: 1}).toArray();
  console.log('\n=== TUTORS (prices) ===');
  tutors.forEach(t => console.log(JSON.stringify(t)));
  
  const schedules = await db.collection('schedules').find({}).sort({createdAt: -1}).limit(5).toArray();
  console.log('\n=== RECENT SCHEDULES ===');
  schedules.forEach(s => console.log(JSON.stringify({_id: s._id, tutorId: s.tutorId, startTime: s.startTime, toTime: s.toTime, type: s.type, isFree: s.isFree, booked: s.booked})));
  
  process.exit(0);
});
