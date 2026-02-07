/**
 * Format a phone number string into a more readable format based on Mexican conventions.
 * 
 * Rules:
 * - Cleans non-numeric characters.
 * - If length is not 10, returns original value.
 * - CDMX (55), GDL (33), MTY (81): Format as (XX) XX XX XX XX
 * - Rest of country: Format as (XXX) X XX XX XX (e.g., (352) 5 01 00 46)
 * 
 * @param {string|number} phoneNumber 
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';

    // Clean non-numeric chars
    const cleaned = String(phoneNumber).replace(/\D/g, '');

    // Check if valid Mexican mobile/landline length (10 digits)
    if (cleaned.length !== 10) {
        return phoneNumber; // Return original if not standard length
    }

    // Check for 2-digit area codes (CDMX: 55, GDL: 33, MTY: 81)
    const twoDigitAreas = ['33', '55', '81'];
    const prefix2 = cleaned.substring(0, 2);

    if (twoDigitAreas.includes(prefix2)) {
        // Format: (XX) XX XX XX XX
        // e.g. 3334121212 -> (33) 34 12 12 12
        return `(${prefix2}) ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
    } else {
        // Format: (XXX) X XX XX XX 
        // e.g. 3525010046 -> (352) 5 01 00 46
        const prefix3 = cleaned.substring(0, 3);
        return `(${prefix3}) ${cleaned.substring(3, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
    }
};

/**
 * Format a currency value to string with $ symbol and NO decimals by default (integer).
 * e.g. 1200 -> "$ 1,200"
 * 
 * @param {number|string} amount 
 * @param {boolean} withDecimals - If true, forces 2 decimal places. Default false.
 * @returns {string} 
 */
export const formatCurrency = (amount, withDecimals = false) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$ 0';

    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: withDecimals ? 2 : 0,
        maximumFractionDigits: withDecimals ? 2 : 0
    }).format(num);
};
