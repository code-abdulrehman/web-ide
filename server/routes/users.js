import express from 'express';
// import userController from '../controllers/userController.js';  // Uncomment when controller is ready

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get all users endpoint (placeholder)' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ message: `Get user with ID: ${req.params.id} (placeholder)` });
});

router.put('/:id', (req, res) => {
  res.status(200).json({ message: `Update user with ID: ${req.params.id} (placeholder)` });
});

router.delete('/:id', (req, res) => {
  res.status(200).json({ message: `Delete user with ID: ${req.params.id} (placeholder)` });
});

export default router;
