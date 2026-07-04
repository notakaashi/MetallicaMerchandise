const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const reviewController = require('../controllers/reviewController');

// Admin Review Routes
router.get('/', adminMiddleware, reviewController.getAllReviewsAdmin);
router.delete('/:id', adminMiddleware, reviewController.deleteReviewAdmin);

module.exports = router;
