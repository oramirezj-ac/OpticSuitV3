import { apiClient } from './apiClient';

/**
 * Servicio para operaciones relacionadas con Pacientes
 */

/**
 * Obtiene lista paginada de pacientes
 * @param {Object} params - Parámetros de consulta (search, page, pageSize)
 * @returns {Promise<Object>} { items, totalItems, page, pageSize, totalPages }
 */
export const getPatients = async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const url = `/api/patients${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get(url);
};

/**
 * Obtiene un paciente por ID
 * @param {string} id - ID del paciente
 * @returns {Promise<Object>} Datos del paciente
 */
export const getPatientById = async (id) => {
    return apiClient.get(`/api/patients/${id}`);
};

/**
 * Obtiene pacientes para auditoría
 * @param {number} year - Año de registro
 * @param {string} letter - Letra inicial del apellido paterno
 * @returns {Promise<Array>} Lista de pacientes
 */
export const getAuditPatients = async (year, letter) => {
    const params = new URLSearchParams({ year, letter });
    return apiClient.get(`/api/patients/audit?${params.toString()}`);
};

/**
 * Obtiene años disponibles para auditoría
 * @returns {Promise<Array<number>>} Lista de años
 */
export const getAuditYears = async () => {
    return apiClient.get('/api/patients/audit/years');
};

/**
 * Verifica duplicados de paciente
 * @param {Object} patientData - Datos del paciente a verificar
 * @returns {Promise<Array>} Lista de posibles duplicados
 */
export const checkDuplicates = async (patientData) => {
    return apiClient.post('/api/patients/check-duplicates', patientData);
};

/**
 * Crea un nuevo paciente
 * @param {Object} patientData - Datos del paciente
 * @returns {Promise<Object>} Paciente creado
 */
export const createPatient = async (patientData) => {
    return apiClient.post('/api/patients', patientData);
};

/**
 * Actualiza un paciente existente
 * @param {string} id - ID del paciente
 * @param {Object} patientData - Datos actualizados
 * @returns {Promise<Object>} Paciente actualizado
 */
export const updatePatient = async (id, patientData) => {
    return apiClient.put(`/api/patients/${id}`, patientData);
};

/**
 * Elimina un paciente
 * @param {string} id - ID del paciente
 * @returns {Promise<void>}
 */
export const deletePatient = async (id) => {
    return apiClient.delete(`/api/patients/${id}`);
};
