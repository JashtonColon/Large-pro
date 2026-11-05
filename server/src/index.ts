import express from 'express';
import mongoose from 'mongoose';
import passwordResetRoutes from "./routes/passwordResetRoutes.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use("/api/auth", passwordResetRoutes);

async function start() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  }

  app.listen(port, () => {
    console.log(`Study Buddy API listening on port ${port}`);
  });
}

start().catch(() => {
  console.error('Server startup failed. Check your MongoDB configuration.');
  process.exitCode = 1;
});
