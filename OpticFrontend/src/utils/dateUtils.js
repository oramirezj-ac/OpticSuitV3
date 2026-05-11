/**
 * Formatea una fecha o cadena de fecha al formato largo en español.
 * Ejemplo: "lunes, 10 de enero de 2026"
 * 
 * @param {string|Date} dateInput - La fecha a formatear
 * @returns {string} La fecha formateada o '-' si es inválida
 */
export const formatDateLong = (dateInput) => {
    if (!dateInput) return '-';

    // Usamos 'UTC' para la visualización porque las fechas en la base de datos 
    // se guardan como medianoche UTC (ej. 2026-04-01T00:00:00Z).
    // Si usamos la zona horaria local, se restan horas y retrocede un día.
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' // Fuerza a mostrar el día calendario original (UTC)
        });
    } catch (e) {
        return '-';
    }
};

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param {string} dateString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {number|null} Edad en años o null si no hay fecha
 */
export const calculateAgeFromDate = (dateString) => {
    if (!dateString) return null;

    // Procesamos la fecha de nacimiento como UTC para evitar desfase de un día
    const birthDate = new Date(dateString);
    const today = new Date();

    // Usamos componentes UTC para el cálculo de edad
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();

    // Ajustar si aún no ha cumplido años este año (comparando con UTC)
    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
        age--;
    }

    return age;
};

/**
 * Calcula una fecha de nacimiento aproximada a partir de la edad y una fecha de referencia
 * @param {number} age - Edad en años
 * @param {string|null} referenceDateString - Fecha de referencia (ej. fechaRegistro). Si es null, usa la fecha actual.
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const calculateDateFromAge = (age, referenceDateString = null) => {
    if (!age || age < 0) return '';

    let refYear;
    if (referenceDateString) {
        // Obtenemos el año en UTC para evitar problemas de zona horaria con fechas ingresadas
        const refDate = new Date(referenceDateString);
        refYear = !isNaN(refDate.getTime()) ? refDate.getUTCFullYear() : new Date().getFullYear();
    } else {
        refYear = new Date().getFullYear();
    }

    const birthYear = refYear - age;
    const birthDate = new Date(Date.UTC(birthYear, 0, 1)); // 1 de enero del año calculado en UTC

    return formatDateForInput(birthDate.toISOString());
};

/**
 * Formatea una fecha ISO para input type="date"
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForInput = (dateInput) => {
    if (!dateInput) return '';
    
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '';

        // Obtenemos los componentes UTC para evitar que la zona horaria local 
        // mueva la fecha un día atrás o adelante.
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (e) {
        // Fallback al método anterior por si las moscas si es un string directo
        return dateInput.toString().split('T')[0];
    }
};
