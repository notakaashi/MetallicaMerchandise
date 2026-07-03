const { Review, User, Product, Transaction, TransactionItem } = require('../models');
const { censor } = require('../utils/profanityFilter');

// GET /api/products/:id/reviews — public, list all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    let productId = req.params.id;
    let reviews = await Review.findAll({
      where: { product_id: productId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    let avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
      : 0;

    res.json({ reviews: reviews, averageRating: avgRating, count: reviews.length });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// GET /api/products/:id/reviews/eligibility — auth required, tells frontend whether to show the review form
exports.checkEligibility = async (req, res) => {
  try {
    let productId = req.params.id;
    let userId = req.user.id;

    let alreadyReviewed = await Review.findOne({ where: { user_id: userId, product_id: productId } });
    if (alreadyReviewed) {
      return res.json({ eligible: false, reason: 'already_reviewed' });
    }

    let purchasedItem = await TransactionItem.findOne({
      where: { product_id: productId },
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { user_id: userId, status: 'completed' },
      }],
    });

    if (!purchasedItem) {
      return res.json({ eligible: false, reason: 'not_purchased' });
    }

    res.json({ eligible: true, transactionId: purchasedItem.transaction_id });
  } catch (err) {
    console.error('Check eligibility error:', err);
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
};

// POST /api/products/:id/reviews — auth required
exports.createReview = async (req, res) => {
  try {
    let productId = req.params.id;
    let userId = req.user.id;
    let rating = parseInt(req.body.rating);
    let comment = req.body.comment || '';

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    let alreadyReviewed = await Review.findOne({ where: { user_id: userId, product_id: productId } });
    if (alreadyReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    let purchasedItem = await TransactionItem.findOne({
      where: { product_id: productId },
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { user_id: userId, status: 'completed' },
      }],
    });

    if (!purchasedItem) {
      return res.status(403).json({ error: 'You can only review products you have purchased and received' });
    }

    let censoredComment = censor(comment);

    let newReview = await Review.create({
      user_id: userId,
      product_id: productId,
      transaction_id: purchasedItem.transaction_id,
      rating: rating,
      comment: censoredComment,
    });

    let fullReview = await Review.findByPk(newReview.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    });

    res.status(201).json({ message: 'Review submitted', review: fullReview });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};
