import { apiClient } from './apiClient';

/**
 * Fetches all users from the current tenant.
 * @returns {Promise<Array>} List of users
 */
export const getUsers = async () => {
    return await apiClient.get('/api/users');
};

/**
 * Fetches a single user by ID.
 * @param {string} id User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (id) => {
    return await apiClient.get(`/api/users/${id}`);
};
