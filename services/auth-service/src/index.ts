import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
