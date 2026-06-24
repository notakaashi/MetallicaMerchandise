const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const ctrl = require('../controllers/transactionController');

router.post('/', auth, ctrl.createTransaction);
router.get('/my', auth, ctrl.getMyTransactions);
router.get('/', admin, ctrl.getAllTransactions);
router.patch('/:id/status', admin, ctrl.updateTransactionStatus);

module.exports = router;
