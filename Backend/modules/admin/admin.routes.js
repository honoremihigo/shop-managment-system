const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth.middleware');
const { getUserById, getAllUsers, deleteUser, createNewUser} = require('./admin.controller');

// All user management routes require authentication
router.use(protect);

// All user management routes are ADMIN ONLY
router.use(authorize('ADMIN'));

// Routes
router.post('/', createNewUser);
router.get('/', getAllUsers);
router.get('/:id',getUserById);
router.delete('/:id',deleteUser);

module.exports = router;