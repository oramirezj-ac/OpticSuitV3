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
