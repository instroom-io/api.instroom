// services/searchService.js
const axios = require('axios');
const cache = require('../utils/cache');
const { checkAndIncrement } = require('../utils/rapidApiLimiter');

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

  await checkAndIncrement();

  try {
    const response = await axios.get(`${baseURL}/v1/search_users`, { headers, params, timeout: 10000 });
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

  await checkAndIncrement();

  try {
    const response = await axios.get(`${baseURL}/v1/similar_accounts`, { headers, params, timeout: 10000 });
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

  await checkAndIncrement();

  try {
    const response = await axios.get(`${baseURL}/v1/search_hashtags`, { headers, params, timeout: 10000 });
    const result = response.data?.data || { count: 0, items: [] };
    cache.set(cacheKey, result);
    return result;
  } catch (apiError) {
    console.error('Error searching hashtags from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to search hashtags from Instagram Social API.');
  }
}

/**
 * Searches for locations by query string via RapidAPI.
 */
async function searchLocations(query) {
  const cacheKey = `search_locations:${query.toLowerCase()}`;
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

  await checkAndIncrement();

  try {
    const response = await axios.get(`${baseURL}/v1/search_locations`, { headers, params, timeout: 10000 });
    const result = response.data?.data || { count: 0, items: [] };
    cache.set(cacheKey, result);
    return result;
  } catch (apiError) {
    console.error('Error searching locations from RapidAPI:', apiError.response?.data ?? apiError.message);
    throw new Error('Failed to search locations from Instagram Social API.');
  }
}

module.exports = {
  searchUsers,
  getSimilarAccounts,
  searchHashtags,
  searchLocations
};
