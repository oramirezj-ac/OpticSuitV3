/**
 * API Client - Servicio centralizado para llamadas HTTP
 * Maneja autenticación, headers y manejo de errores de forma consistente
 */

/**
 * Obtiene el token de autenticación del localStorage
 * @returns {string|null} Token de autenticación
 */
const getAuthToken = () => localStorage.getItem('token');

/**
 * Maneja la respuesta de la API de forma consistente
 * @param {Response} response - Respuesta de fetch
 * @returns {Promise<any>} Datos parseados o error
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = 'Error en la petición';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        } catch {
            try {
                errorMessage = await response.text();
            } catch {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        throw new Error(errorMessage);
    }

    // Manejar respuestas vacías (204 No Content, DELETE exitosos)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        return null;
    }

    return response.json();
};

/**
 * Cliente API centralizado
 * Provee métodos para GET, POST, PUT, DELETE con configuración consistente
 */
export const apiClient = {
    /**
     * Petición GET
     * @param {string} url - URL del endpoint
     * @param {Object} customHeaders - Headers adicionales opcionales
     * @returns {Promise<any>} Respuesta parseada
     */
    get: async (url, customHeaders = {}) => {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                ...customHeaders
            }
        });
        return handleResponse(response);
    },

    /**
     * Petición POST
     * @param {string} url - URL del endpoint
     * @param {Object} data - Datos a enviar
     * @param {Object} customHeaders - Headers adicionales opcionales
     * @returns {Promise<any>} Respuesta parseada
     */
    post: async (url, data, customHeaders = {}) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`,
                ...customHeaders
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    /**
     * Petición PUT
     * @param {string} url - URL del endpoint
     * @param {Object} data - Datos a actualizar
     * @param {Object} customHeaders - Headers adicionales opcionales
     * @returns {Promise<any>} Respuesta parseada
     */
    put: async (url, data, customHeaders = {}) => {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`,
                ...customHeaders
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    /**
     * Petición DELETE
     * @param {string} url - URL del endpoint
     * @param {Object} customHeaders - Headers adicionales opcionales
     * @returns {Promise<any>} Respuesta parseada
     */
    delete: async (url, customHeaders = {}) => {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                ...customHeaders
            }
        });
        return handleResponse(response);
    }
};
