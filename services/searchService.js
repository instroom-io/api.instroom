// services/searchService.js
const axios = require('axios');
const https = require('https');
const cache = require('../utils/cache');
const { checkAndIncrement } = require('../utils/rapidApiLimiter');

// Reuse TCP connections across requests (avoids TLS handshake per call)
const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

/**
 * Searches for Instagram users by query string via RapidAPI.
 */
async function searchUsers(query) {
  const cacheKey = `search_users:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    throw new Error('API configuration is incomplete.');
  }

  const headers = { 'x-rapidapi-key': rapidApiKey, 'x-rapidapi-host': rapidApiHost };
  const params = { search_query: query };
  const baseURL = `https://${rapidApiHost}`;

  await checkAndIncrement('instroomApp', 1, 'users');

  try {
    const response = await axios.get(`${baseURL}/v1/search_users`, { headers, params, timeout: 10000, httpsAgent: keepAliveAgent });
    const result = response.data?.data || { count: 0, items: [] };
    cache.set(cacheKey, result);
    return result;
  } catch (apiError) {
    console.error('Error searching users from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to search users from Instagram Social API.');
  }
}

/**
 * Fetches similar accounts for a given username via RapidAPI.
 */
async function getSimilarAccounts(username) {
  const cacheKey = `similar:${username}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    throw new Error('API configuration is incomplete.');
  }

  const headers = { 'x-rapidapi-key': rapidApiKey, 'x-rapidapi-host': rapidApiHost };
  const params = { username_or_id_or_url: username };
  const baseURL = `https://${rapidApiHost}`;

  await checkAndIncrement('instroomApp', 1, 'similar');

  try {
    const response = await axios.get(`${baseURL}/v1/similar_accounts`, { headers, params, timeout: 10000, httpsAgent: keepAliveAgent });
    const result = response.data?.data || { count: 0, items: [] };
    cache.set(cacheKey, result);
    return result;
  } catch (apiError) {
    console.error('Error fetching similar accounts from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to fetch similar accounts from Instagram Social API.');
  }
}

/**
 * Searches for hashtags by query string via RapidAPI.
 */
async function searchHashtags(query) {
  const cacheKey = `search_hashtags:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    throw new Error('API configuration is incomplete.');
  }

  const headers = { 'x-rapidapi-key': rapidApiKey, 'x-rapidapi-host': rapidApiHost };
  const params = { search_query: query };
  const baseURL = `https://${rapidApiHost}`;

  await checkAndIncrement('instroomApp', 1, 'hashtags');

  try {
    const response = await axios.get(`${baseURL}/v1/search_hashtags`, { headers, params, timeout: 10000, httpsAgent: keepAliveAgent });
    const result = response.data?.data || { count: 0, items: [] };
    cache.set(cacheKey, result);
    return result;
  } catch (apiError) {
    console.error('Error searching hashtags from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to search hashtags from Instagram Social API.');
  }
}

/**
 * Searches for a location by name, then fetches posts from the top match
 * and returns unique user profiles found at that location.
 */
async function searchLocationUsers(query) {
  const cacheKey = `location_users:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    throw new Error('API configuration is incomplete.');
  }

  const headers = { 'x-rapidapi-key': rapidApiKey, 'x-rapidapi-host': rapidApiHost };
  const baseURL = `https://${rapidApiHost}`;
  const opts = { headers, timeout: 10000, httpsAgent: keepAliveAgent };

  // Single rate-limit check for both API calls upfront
  await checkAndIncrement('instroomApp', 2, 'locations');

  // Step 1: Search for the location
  let locationId;
  let locationName;
  try {
    const locResponse = await axios.get(`${baseURL}/v1/search_location`, { ...opts, params: { search_query: query } });
    const locations = locResponse.data?.data?.items || [];
    if (locations.length === 0) {
      const result = { location: null, count: 0, items: [] };
      cache.set(cacheKey, result);
      return result;
    }
    locationId = locations[0].id;
    locationName = locations[0].name;
  } catch (apiError) {
    console.error('Error searching locations from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to search locations from Instagram Social API.');
  }

  // Step 2: Fetch posts from that location
  try {
    const postsResponse = await axios.get(`${baseURL}/v1/location_posts`, { ...opts, params: { location_id: locationId }, timeout: 30000 });
    const items = postsResponse.data?.data?.items || [];

    const seen = new Set();
    const users = [];
    for (const item of items) {
      const user = item.caption?.user || item.user;
      if (user && !seen.has(user.id)) {
        seen.add(user.id);
        users.push({
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          is_verified: user.is_verified,
          profile_pic_url: user.profile_pic_url
        });
      }
    }

    const result = { location: { id: locationId, name: locationName }, count: users.length, items: users };
    cache.set(cacheKey, result);
    return result;
  } catch (apiError) {
    console.error('Error fetching location posts from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to fetch posts from this location.');
  }
}

/**
 * Searches for posts by keyword via RapidAPI and extracts user profiles.
 */
async function searchPosts(query) {
  const cacheKey = `search_posts:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    throw new Error('API configuration is incomplete.');
  }

  const headers = { 'x-rapidapi-key': rapidApiKey, 'x-rapidapi-host': rapidApiHost };
  const params = { search_query: query };
  const baseURL = `https://${rapidApiHost}`;

  await checkAndIncrement('instroomApp', 1, 'posts');

  try {
    const response = await axios.get(`${baseURL}/v1/search_posts`, { headers, params, timeout: 30000, httpsAgent: keepAliveAgent });
    const items = response.data?.data?.items || [];

    const seen = new Set();
    const users = [];
    for (const item of items) {
      const user = item.caption?.user || item.user;
      if (user && !seen.has(user.id)) {
        seen.add(user.id);
        users.push({
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          is_verified: user.is_verified,
          profile_pic_url: user.profile_pic_url
        });
      }
    }

    const result = { count: users.length, items: users };
    cache.set(cacheKey, result);
    return result;
  } catch (apiError) {
    console.error('Error searching posts from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to search posts from Instagram Social API.');
  }
}

module.exports = {
  searchUsers,
  getSimilarAccounts,
  searchHashtags,
  searchLocationUsers,
  searchPosts
};
