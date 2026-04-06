const mongoose = require('mongoose');
const nconf = require('nconf');
const path = require('path');

async function updateTemplate() {
    nconf.argv()
         .env()
         .file({ file: path.join(__dirname, 'server', 'config', 'development.js') });

    const mongoUri = nconf.get('MONGO_URI') || 'mongodb://127.0.0.1/pinlearn';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const content = `<p>Hello {{user.name}},</p>
<p>You have an unread message from 
  {% if sender.type === "tutor" %}
    {{sender.userId}}
  {% else %}
    {{sender.name}}
  {% endif %}.
</p>
<p>Content: {{message.text}}</p>
<p>Please check your message at: <a href="{{appConfig.userWebUrl}}/users/conversations">{{appConfig.userWebUrl}}/users/conversations</a></p>`;

    const result = await mongoose.connection.db.collection('emailtemplates').updateOne(
        { key: 'new-message' },
        { $set: { content: content } }
    );
    
    console.log('Update result:', JSON.stringify(result, null, 2));
    
    mongoose.connection.close();
}

updateTemplate();
