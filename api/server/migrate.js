const migrate = require('migrate');
require('dotenv').config();
require('./app');
class MongoDbStore {
  async load(fn) {
    let data = null;
    try {
      data = await DB.Migration.find();
      if (data.length !== 1) {
        // eslint-disable-next-line no-console
        console.log('Cannot read migrations from database. If this is the first time you run migrations, then this is normal.');
        return fn(null, {});
      }
    } catch (e) {
      console.log('sfesfefs', e);
    }
    return fn(null, data[0]);
  }

  async save(set, fn) {
    let result = null;
    try {
      result = await DB.Migration.updateOne(
        {},
        {
          $set: {
            lastRun: set.lastRun
          },
          $push: {
            migrations: { $each: set.migrations }
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.log(err);
    }

    return fn(null, result);
  }
}

migrate.load(
  {
    // Set class as custom stateStore
    stateStore: new MongoDbStore(),
    // do not filter lib folder, load only js file
    filterFunction: fileName => fileName.includes('.js') && !fileName.includes('lib/')
  },
  async (err, set) => {
    if (err) {
      console.log('migrate er>>>', err);
      throw err;
    }

    set.up(err2 => {
      if (err2) {
        throw err2;
      }
      // eslint-disable-next-line no-console
      console.log('Migrations successfully ran');
      process.exit();
    });
  }
);
