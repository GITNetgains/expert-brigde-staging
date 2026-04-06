const mongoose = require('mongoose');
const nconf = require('nconf');
const path = require('path');

async function checkTemplate() {
    nconf.argv()
         .env()
         .file({ file: path.join(__dirname, 'server', 'config', 'development.js') });

    const mongoUri = nconf.get('MONGO_URI') || 'mongodb://127.0.0.1/pinlearn';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Check possible collection names
    const names = ['emailtemplates', 'email-templates', 'email_templates'];
    for (const name of names) {
        const result = await mongoose.connection.db.collection(name).findOne({ key: 'new-message' });
        if (result) {
            console.log(`Found in: ${name}`);
            console.log(JSON.stringify(result, null, 2));
            break;
        }
    }
    
    mongoose.connection.close();
}

checkTemplate();
