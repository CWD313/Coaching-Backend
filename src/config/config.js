import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/coaching_db'
  },
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_key',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  auth: {
    adminInviteCode: process.env.ADMIN_INVITE_CODE || 'COACH2025INVITE'
  }
};
