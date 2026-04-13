// routes/search.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Search for Instagram users by query
router.get('/users', searchController.searchUsers);

// Find similar accounts by username
router.get('/similar/:username', searchController.fetchSimilarAccounts);

// Search for hashtags by query
router.get('/hashtags', searchController.searchHashtags);

// Search for locations by query
router.get('/locations', searchController.searchLocations);

module.exports = router;
