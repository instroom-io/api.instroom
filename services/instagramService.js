// services/instagramService.js
const axios = require('axios');

// Retrieve the access token from environment variables
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
const instagramBusinessId = '17841456893636311'; // Your Instagram Business Account ID

/**
 * Fetches user data from the Instagram Graph API using business_discovery.
 * @param {string} username The Instagram username to look up.
 * @returns {Promise<object>} The data returned from the API.
 */
async function getUserProfile(username) {
  if (!accessToken) {
    console.error('Instagram Access Token is not defined in environment variables.');
    // Throw an error that can be caught by the controller
    throw new Error('API configuration is incomplete.');
  }

  const fields = 'business_discovery.fields(id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url)';
  const url = `https://graph.facebook.com/v25.0/${instagramBusinessId}?fields=${fields}.username(${username})&access_token=${accessToken}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (apiError) {
    // Log the detailed error for server-side debugging
    console.error('Error fetching data from Instagram API:', apiError.response ? apiError.response.data : apiError.message);
    // Re-throw a more generic error to be handled by the controller
    throw new Error('Failed to fetch data from Instagram.');
  }
}

module.exports = {
  getUserProfile
};
