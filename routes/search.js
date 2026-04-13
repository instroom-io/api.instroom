// routes/search.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Search for Instagram users by query
router.get('/users/:query', searchController.searchUsers);

// Find similar accounts by username
router.get('/similar/:username', searchController.fetchSimilarAccounts);

// Search for hashtags by query
router.get('/hashtags/:query', searchController.searchHashtags);

// Search users by location name (supports spaces)
router.get('/locations/{*query}', searchController.searchLocationUsers);

// Search posts by keyword (returns unique user profiles)
router.get('/posts/:query', searchController.searchPosts);

module.exports = router;
