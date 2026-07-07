const router = require('express').Router();
const userController = require('../controllers/userController');
const adminMiddleware = require('../middleware/admin');

const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    let uniqueId = Date.now() + '-' + Math.round(Math.random() * 1000000000);
    let extension = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueId + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    let allowedExtensions = /jpeg|jpg|png|gif|webp/;
    let fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.test(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, upload.single('avatar'), userController.updateProfile);

router.get('/deleted', adminMiddleware, userController.getDeletedUsers);
router.put('/:id/restore', adminMiddleware, userController.restoreUser);

router.get('/', adminMiddleware, userController.getAllUsers);
router.post('/', adminMiddleware, userController.createUser);
router.put('/:id', adminMiddleware, userController.updateUser);
router.delete('/:id', adminMiddleware, userController.deleteUser);

module.exports = router;
