const mongoose = require('mongoose');

exports.model = {
  Migration() {
    const MigrationSchema = new mongoose.Schema(
      {
        lastRun: {
          type: String
        },
        migrations: [{ type: mongoose.Schema.Types.Mixed }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      },
      {
        collection: 'migrations',
        minimize: false,
        timestamps: {
          createdAt: 'createdAt',
          updatedAt: 'updatedAt'
        }
      }
    );

    return MigrationSchema;
  }
};
