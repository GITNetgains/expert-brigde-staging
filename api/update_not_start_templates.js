const mongoose = require('mongoose');
const nconf = require('nconf');
const path = require('path');

async function updateTemplates() {
    nconf.argv()
         .env()
         .file({ file: path.join(__dirname, 'server', 'config', 'development.js') });

    const mongoUri = nconf.get('MONGO_URI') || 'mongodb://127.0.0.1/pinlearn';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // 1. tutor-not-start-meeting-to-tutor
    const tutorContent = `<p>Hello {{tutorId}},</p>
<p>You did not start meeting for the session #{{appointment.code}}.</p>
<p><strong>Appointment code: </strong>#{{appointment.code}}</p>
<p><strong>Client: </strong> {{userName}}</p>
<p><strong>Time: </strong> {{startTime}} - {{toTime}} <br /></p>`;

    await mongoose.connection.db.collection('emailtemplates').updateOne(
        { key: 'tutor-not-start-meeting-to-tutor' },
        { $set: { content: tutorContent } }
    );

    // 2. tutor-not-start-meeting-to-admin
    const adminContent = `<p>Hello Admin,</p>
<p>Expert (ID: {{tutorId}}) did not start meeting for the session #{{appointment.code}}</p>
<p><strong>Client: </strong> {{userName}}</p>
<p><strong>Subject: </strong> {{appointment.subject.name}}</p>
<p><strong>Time: </strong> {{startTime}} - {{toTime}} <br /></p>`;

    await mongoose.connection.db.collection('emailtemplates').updateOne(
        { key: 'tutor-not-start-meeting-to-admin' },
        { $set: { content: adminContent } }
    );
    
    console.log('Templates updated successfully');
    mongoose.connection.close();
}

updateTemplates();
