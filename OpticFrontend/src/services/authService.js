/**
 * Authentication Service - Centraliza el manejo de credenciales en sessionStorage
 */

const KEYS = {
    TOKEN: 'token',
    USER_EMAIL: 'userEmail',
    USER_SCHEMA: 'userSchema',
    USER_ROLES: 'userRoles',
    USER_ID: 'userId'
};

export const authService = {
    /**
     * Guarda las credenciales tras un login exitoso
     * @param {Object} data - Datos devueltos por la API de auth
     */
    setAuth: (data) => {
        if (data.token) sessionStorage.setItem(KEYS.TOKEN, data.token);
        if (data.userId) sessionStorage.setItem(KEYS.USER_ID, data.userId);
        if (data.email) sessionStorage.setItem(KEYS.USER_EMAIL, data.email);
        if (data.schema) sessionStorage.setItem(KEYS.USER_SCHEMA, data.schema);
        if (data.roles) {
            sessionStorage.setItem(KEYS.USER_ROLES, JSON.stringify(data.roles));
        }
    },

    /**
     * Obtiene el token de autenticación
     * @returns {string|null}
     */
    getToken: () => sessionStorage.getItem(KEYS.TOKEN),

    /**
     * Obtiene el email del usuario logueado
     * @returns {string}
     */
    getUserEmail: () => sessionStorage.getItem(KEYS.USER_EMAIL) || 'Usuario',

    /**
     * Obtiene el ID del usuario logueado
     * @returns {string|null}
     */
    getUserId: () => sessionStorage.getItem(KEYS.USER_ID),

    /**
     * Obtiene el esquema (sucursal) del usuario logueado
     * @returns {string|null}
     */
    getUserSchema: () => sessionStorage.getItem(KEYS.USER_SCHEMA),

    /**
     * Obtiene los roles del usuario logueado
     * @returns {Array<string>}
     */
    getUserRoles: () => {
        try {
            const roles = sessionStorage.getItem(KEYS.USER_ROLES);
            return roles ? JSON.parse(roles) : [];
        } catch (e) {
            console.error("Error parsing user roles", e);
            return [];
        }
    },

    /**
     * Elimina todas las credenciales (Logout)
     */
    clearAuth: () => {
        sessionStorage.removeItem(KEYS.TOKEN);
        sessionStorage.removeItem(KEYS.USER_ID);
        sessionStorage.removeItem(KEYS.USER_EMAIL);
        sessionStorage.removeItem(KEYS.USER_SCHEMA);
        sessionStorage.removeItem(KEYS.USER_ROLES);
    },

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean}
     */
    isAuthenticated: () => !!sessionStorage.getItem(KEYS.TOKEN)
};
