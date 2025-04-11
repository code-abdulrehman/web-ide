import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import codeRoutes from './code.js';

const router = express.Router();

// Root API route for testing
router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/code', codeRoutes);

export default router;
