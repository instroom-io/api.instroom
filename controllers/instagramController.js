// controllers/instagramController.js
const Joi = require('joi');
const instagramService = require('../services/instagramService');

// Define the validation schema for the username
const usernameSchema = Joi.object({
  // Instagram usernames can contain letters, numbers, periods, and underscores.
  // The previous .alphanum() was too restrictive.
  username: Joi.string().pattern(/^[a-zA-Z0-9._]+$/).min(1).max(30).required()
});

/**
 * Controller to handle the request for fetching an Instagram user's profile.
 */
async function fetchUserProfile(req, res) {
  const { username } = req.params;

  // 1. Validate the input
  const { error } = usernameSchema.validate({ username });
  if (error) {
    return res.status(400).json({ message: 'Invalid username format.', details: error.details });
  }

  try {
    // 2. Call the service to get the data
    const userData = await instagramService.getUserProfile(username);
    
    // 3. Send the successful response
    res.status(200).json(userData);
  } catch (serviceError) {
    // 4. Handle errors from the service
    // Check the error message to decide the status code
    const statusCode = serviceError.message.includes('configuration') ? 500 : 502; // 500 for our fault, 502 Bad Gateway for external API fault
    res.status(statusCode).json({ message: serviceError.message });
  }
}

module.exports = {
  fetchUserProfile
};
