// controllers/searchController.js
const Joi = require('joi');
const searchService = require('../services/searchService');

const querySchema = Joi.object({
  query: Joi.string().min(1).max(100).required()
});

const usernameSchema = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9._]+$/).min(1).max(30).required()
});


/**
 * Controller for searching Instagram users.
 */
async function searchUsers(req, res) {
  const { query } = req.params;

  const { error } = querySchema.validate({ query });
  if (error) {
    return res.status(400).json({ message: 'Invalid search query.', details: error.details });
  }

  try {
    const results = await searchService.searchUsers(query);
    res.status(200).json(results);
  } catch (serviceError) {
    const statusCode = serviceError.message.includes('configuration') ? 500 : 502;
    res.status(statusCode).json({ message: serviceError.message });
  }
}

/**
 * Controller for fetching similar accounts.
 */
async function fetchSimilarAccounts(req, res) {
  const { username } = req.params;

  const { error } = usernameSchema.validate({ username });
  if (error) {
    return res.status(400).json({ message: 'Invalid username format.', details: error.details });
  }

  try {
    const results = await searchService.getSimilarAccounts(username);
    res.status(200).json(results);
  } catch (serviceError) {
    const statusCode = serviceError.message.includes('configuration') ? 500 : 502;
    res.status(statusCode).json({ message: serviceError.message });
  }
}

/**
 * Controller for searching hashtags.
 */
async function searchHashtags(req, res) {
  const { query } = req.params;

  const { error } = querySchema.validate({ query });
  if (error) {
    return res.status(400).json({ message: 'Invalid search query.', details: error.details });
  }

  try {
    const results = await searchService.searchHashtags(query);
    res.status(200).json(results);
  } catch (serviceError) {
    const statusCode = serviceError.message.includes('configuration') ? 500 : 502;
    res.status(statusCode).json({ message: serviceError.message });
  }
}

/**
 * Controller for searching users by location name.
 */
async function searchLocationUsers(req, res) {
  const rawQuery = req.params.query;
  const query = Array.isArray(rawQuery) ? rawQuery.join(' ') : rawQuery;

  const { error } = querySchema.validate({ query });
  if (error) {
    return res.status(400).json({ message: 'Invalid search query.', details: error.details });
  }

  try {
    const results = await searchService.searchLocationUsers(query);
    res.status(200).json(results);
  } catch (serviceError) {
    const statusCode = serviceError.message.includes('configuration') ? 500 : 502;
    res.status(statusCode).json({ message: serviceError.message });
  }
}

/**
 * Controller for searching posts by keyword (returns user profiles).
 */
async function searchPosts(req, res) {
  const { query } = req.params;

  const { error } = querySchema.validate({ query });
  if (error) {
    return res.status(400).json({ message: 'Invalid search query.', details: error.details });
  }

  try {
    const results = await searchService.searchPosts(query);
    res.status(200).json(results);
  } catch (serviceError) {
    const statusCode = serviceError.message.includes('configuration') ? 500 : 502;
    res.status(statusCode).json({ message: serviceError.message });
  }
}

module.exports = {
  searchUsers,
  fetchSimilarAccounts,
  searchHashtags,
  searchLocationUsers,
  searchPosts
};
