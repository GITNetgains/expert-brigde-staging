const mongoose = require('mongoose');
const nconf = require('nconf');
const path = require('path');

async function listCollections() {
    nconf.argv()
         .env()
         .file({ file: path.join(__dirname, 'server', 'config', 'development.js') });

    const mongoUri = nconf.get('MONGO_URI') || 'mongodb://127.0.0.1/pinlearn';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    mongoose.connection.close();
}

listCollections();
