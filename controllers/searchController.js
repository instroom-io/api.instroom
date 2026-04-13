// controllers/searchController.js
const Joi = require('joi');
const searchService = require('../services/searchService');

const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).max(100).required()
});

const usernameSchema = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9._]+$/).min(1).max(30).required()
});

/**
 * Controller for searching Instagram users.
 */
async function searchUsers(req, res) {
  const { error } = searchQuerySchema.validate({ q: req.query.q });
  if (error) {
    return res.status(400).json({ message: 'Invalid search query.', details: error.details });
  }

  try {
    const results = await searchService.searchUsers(req.query.q);
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
  const { error } = searchQuerySchema.validate({ q: req.query.q });
  if (error) {
    return res.status(400).json({ message: 'Invalid search query.', details: error.details });
  }

  try {
    const results = await searchService.searchHashtags(req.query.q);
    res.status(200).json(results);
  } catch (serviceError) {
    const statusCode = serviceError.message.includes('configuration') ? 500 : 502;
    res.status(statusCode).json({ message: serviceError.message });
  }
}

/**
 * Controller for searching locations.
 */
async function searchLocations(req, res) {
  const { error } = searchQuerySchema.validate({ q: req.query.q });
  if (error) {
    return res.status(400).json({ message: 'Invalid search query.', details: error.details });
  }

  try {
    const results = await searchService.searchLocations(req.query.q);
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
  searchLocations
};
