import "dotenv/config.js";
import express from 'express';
import mongoose from 'mongoose';
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import emailVerificationRoutes from "./routes/emailVerificationRoutes.js";

import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(express.json());

//Password Reset Routes
app.use("/api/auth", passwordResetRoutes);

//Email Verification Routes
app.use("/api/auth", emailVerificationRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Start server & connect to MongoDB
async function start() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  }

  app.listen(PORT, () => {
    console.log(`Study Buddy API listening on port ${PORT}`);
  });
}

start().catch(() => {
  console.error('Server startup failed. Check your MongoDB configuration.');
  process.exitCode = 1;
});
