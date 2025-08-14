import express from 'express';

const router = express.Router();

// Placeholder route - to be implemented
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Reports endpoint - coming soon',
    data: []
  });
});

export default router;