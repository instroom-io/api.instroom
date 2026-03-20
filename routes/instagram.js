// routes/instagram.js
const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');

// Route for getting user profile information
router.get('/:username/user', instagramController.fetchUserProfile);
 
// Route for getting user media
router.get('/:username/media', instagramController.fetchUserMedia);
 
// Route for getting user stats
router.get('/:username/userstat', instagramController.fetchUserStats);

// Route for getting user stats from RapidAPI
router.get('/:username/userstat_rapid', instagramController.fetchUserStatsFromRapidAPI);

// Route for getting user info from RapidAPI
router.get('/:username/info', instagramController.fetchUserInfo);

// Route for getting user posts from RapidAPI
router.get('/:username/posts', instagramController.fetchUserPosts);

// Route for getting a full user overview (profile + stats + contact/location)
router.get('/v1/:username/instagram', instagramController.fetchUserOverview);

// Route for getting a full user overview using only RapidAPI
router.get('/v2/:username/instagram', instagramController.fetchUserOverviewFromRapidAPI);

module.exports = router;
