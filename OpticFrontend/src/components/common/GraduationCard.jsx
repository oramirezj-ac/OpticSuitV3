import React from 'react';
import './GraduationCard.css';

const GraduationCard = ({ graduation, showHeader = true, title = null }) => {
    if (!graduation) return null;

    const renderValue = (val) => {
        if (val === null || val === undefined || val === '') return '-';
        return typeof val === 'number' ? val.toFixed(2) : val;
    };

    return (
        <div className="graduation-card-container animate-fade-in">
            {title && <div className="graduation-card-title">{title}</div>}
            <div className="graduation-grid">
                {/* Header Row */}
                <div className="grid-header"></div>
                <div className="grid-header">ESFERA</div>
                <div className="grid-header">CILINDRO</div>
                <div className="grid-header">EJE</div>
                <div className="grid-header">ADICIÓN</div>

                {/* OD Row */}
                <div className="grid-label od">OD</div>
                <div className="grid-value">{renderValue(graduation.odEsfera)}</div>
                <div className="grid-value">{renderValue(graduation.odCilindro)}</div>
                <div className="grid-value">{graduation.odEje || '-'}</div>
                <div className="grid-value">{renderValue(graduation.odAdicion)}</div>

                {/* OI Row */}
                <div className="grid-label oi">OI</div>
                <div className="grid-value">{renderValue(graduation.oiEsfera)}</div>
                <div className="grid-value">{renderValue(graduation.oiCilindro)}</div>
                <div className="grid-value">{graduation.oiEje || '-'}</div>
                <div className="grid-value">{renderValue(graduation.oiAdicion)}</div>
            </div>
            
            {(graduation.detallesMontaje) && (
                <div className="graduation-card-footer">
                    {(() => {
                        try {
                            const dm = typeof graduation.detallesMontaje === 'string' 
                                ? JSON.parse(graduation.detallesMontaje) 
                                : graduation.detallesMontaje;
                            return dm.dp ? <span className="footer-item"><strong>DP:</strong> {dm.dp} mm</span> : null;
                        } catch (e) { return null; }
                    })()}
                </div>
            )}
        </div>
    );
};

export default GraduationCard;
