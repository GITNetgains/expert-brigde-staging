const mongoose = require('mongoose');
const nconf = require('nconf');
const path = require('path');

async function checkTemplate() {
    nconf.argv()
         .env()
         .file({ file: path.join(__dirname, 'server', 'config', 'development.js') });

    const mongoUri = nconf.get('MONGO_URI') || 'mongodb://127.0.0.1/pinlearn';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const EmailTemplate = mongoose.model('EmailTemplate', new mongoose.Schema({
        key: String,
        content: String
    }, { collection: 'email_templates' }));

    const template = await EmailTemplate.findOne({ key: 'new-message' });
    console.log('Template found:', JSON.stringify(template, null, 2));
    
    mongoose.connection.close();
}

checkTemplate();
