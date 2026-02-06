import React from 'react';

// Helper Component for Optical Inputs
const DiopterInput = ({ name, value, onChange, min, max, placeholder, isCylinder = false, isAxis = false }) => {

    // Función auxiliar para redondear y formatear
    const formatValue = (val) => {
        if (isNaN(val) || val === '' || val === null) return '';

        // Round logic
        let num = parseFloat(val);
        if (isAxis) {
            num = Math.round(num);
        } else {
            num = Math.round(num * 4) / 4;
        }

        // Clamp logic
        if (min !== undefined && num < min) num = min;
        if (max !== undefined && num > max) num = max;

        // Validar cilindro negativo y adición positiva
        if (isCylinder && num > 0) num = 0; // Cilindro max 0

        let formatted = "";
        if (isAxis) {
            formatted = num.toString();
        } else {
            formatted = num.toFixed(2);
            if (num > 0 && !isCylinder) formatted = "+" + formatted;
        }
        return formatted;
    };

    const handleStep = (direction) => {
        let current = parseFloat(value);
        if (isNaN(current)) current = 0;

        const step = isAxis ? 1 : 0.25;
        const newVal = direction === 'up' ? current + step : current - step;

        const formatted = formatValue(newVal);
        onChange({ target: { name, value: formatted } });
    };

    const handleBlur = (e) => {
        const currentVal = e.target.value;
        if (currentVal === '-' || currentVal === '+' || currentVal === '') return;
        const formatted = formatValue(currentVal);
        onChange({ target: { name, value: formatted } });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); handleStep('up'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); handleStep('down'); }
    };

    return (
        <div className="diopter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button tabIndex="-1" onClick={() => handleStep('down')} className="btn-step" type="button">‹</button>
            <input
                type="text"
                inputMode={isAxis ? "numeric" : "decimal"}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="input-compact"
                placeholder={placeholder}
                autoComplete="off"
                style={{ textAlign: 'center', fontWeight: 'bold' }}
            />
            <button tabIndex="-1" onClick={() => handleStep('up')} className="btn-step" type="button">›</button>
        </div>
    );
};

export default DiopterInput;
