import React from 'react';
import './SuccessOverlay.css';

const SuccessOverlay = ({ show, message, onAnimationEnd }) => {
    if (!show) return null;

    return (
        <div className="success-overlay-container">
            <div className="success-card">
                <div className="check-container">
                    <div className="check-background"></div>
                    <svg className="check-svg" viewBox="0 0 52 52">
                        <circle className="check-circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                </div>
                <p className="success-message">{message || '¡Operación Exitosa!'}</p>
            </div>
        </div>
    );
};

export default SuccessOverlay;
