/**
 * Formatea una fecha o cadena de fecha al formato largo en español.
 * Ejemplo: "lunes, 10 de enero de 2026"
 * 
 * @param {string|Date} dateInput - La fecha a formatear
 * @returns {string} La fecha formateada o '-' si es inválida
 */
export const formatDateLong = (dateInput) => {
    if (!dateInput) return '-';

    const date = new Date(dateInput);

    // Validar si es una fecha válida
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param {string} dateString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {number|null} Edad en años o null si no hay fecha
 */
export const calculateAgeFromDate = (dateString) => {
    if (!dateString) return null;

    const birthDate = new Date(dateString);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Ajustar si aún no ha cumplido años este año
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

/**
 * Calcula una fecha de nacimiento aproximada a partir de la edad
 * @param {number} age - Edad en años
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const calculateDateFromAge = (age) => {
    if (!age || age < 0) return '';

    const today = new Date();
    const birthYear = today.getFullYear() - age;
    const birthDate = new Date(birthYear, 0, 1); // 1 de enero del año calculado

    return formatDateForInput(birthDate.toISOString());
};

/**
 * Formatea una fecha ISO para input type="date"
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
};
