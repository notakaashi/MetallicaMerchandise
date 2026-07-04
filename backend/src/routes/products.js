const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadDir) === false) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    let uniqueId = Date.now() + '-' + Math.round(Math.random() * 1000000000);
    let extension = path.extname(file.originalname);
    cb(null, 'product-' + uniqueId + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    let allowedExtensions = /jpeg|jpg|png|gif|webp/;
    let fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.test(fileExtension) === true) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/autocomplete', productController.autocompleteProducts);
router.get('/:id', productController.getProduct);

router.get('/:id/reviews', reviewController.getProductReviews);
router.get('/:id/reviews/eligibility', auth, reviewController.checkEligibility);
router.post('/:id/reviews', auth, reviewController.createReview);
router.put('/:id/reviews', auth, reviewController.updateReview);

router.post('/', adminMiddleware, upload.array('images', 5), productController.createProduct);
router.put('/:id', adminMiddleware, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', adminMiddleware, productController.deleteProduct);

module.exports = router;
