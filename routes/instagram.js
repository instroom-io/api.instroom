// routes/instagram.js
const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');

// Define the route for getting user profile information
// GET /api/instagram/user/:username
router.get('/user/:username', instagramController.fetchUserProfile);

module.exports = router;
