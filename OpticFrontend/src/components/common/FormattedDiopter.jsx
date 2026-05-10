import React from 'react';

const FormattedDiopter = ({ value, type }) => {
    if (value === null || value === undefined || value === '') return <span>-</span>;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return <span>{value}</span>;

    let formattedText = '';
    let color = '#000000'; // default black
    let fontWeight = 'bold';

    switch (type) {
        case 'esfera':
            if (numValue === 0) {
                formattedText = '0.00';
                color = '#000000'; // negro
            } else if (numValue < 0) {
                formattedText = numValue.toFixed(2);
                color = '#dc2626'; // rojo
            } else {
                formattedText = `+${numValue.toFixed(2)}`;
                color = '#16a34a'; // verde
            }
            break;
            
        case 'cilindro':
            // Siempre negativo (rojo), si es 0, negro
            if (numValue === 0) {
                formattedText = '0.00';
                color = '#000000';
            } else {
                formattedText = numValue.toFixed(2);
                color = '#dc2626'; // rojo
            }
            break;
            
        case 'eje':
            // Siempre negro
            formattedText = `${Math.round(numValue)}°`;
            color = '#000000';
            break;
            
        case 'adicion':
            // Siempre positivo (verde)
            if (numValue === 0) {
                formattedText = '0.00';
                color = '#000000';
            } else {
                formattedText = `+${numValue.toFixed(2)}`;
                color = '#16a34a'; // verde
            }
            break;
            
        default:
            formattedText = numValue.toFixed(2);
            color = '#000000';
    }

    return <span style={{ color, fontWeight }}>{formattedText}</span>;
};

export default FormattedDiopter;
