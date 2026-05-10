import React from 'react';
import FormattedDiopter from './FormattedDiopter';
import './GraduationCard.css';

const GraduationCard = ({ graduation, showHeader = true, title = null }) => {
    if (!graduation) return null;

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
                <div className="grid-value"><FormattedDiopter value={graduation.odEsfera} type="esfera" /></div>
                <div className="grid-value"><FormattedDiopter value={graduation.odCilindro} type="cilindro" /></div>
                <div className="grid-value"><FormattedDiopter value={graduation.odEje} type="eje" /></div>
                <div className="grid-value"><FormattedDiopter value={graduation.odAdicion} type="adicion" /></div>

                {/* OI Row */}
                <div className="grid-label oi">OI</div>
                <div className="grid-value"><FormattedDiopter value={graduation.oiEsfera} type="esfera" /></div>
                <div className="grid-value"><FormattedDiopter value={graduation.oiCilindro} type="cilindro" /></div>
                <div className="grid-value"><FormattedDiopter value={graduation.oiEje} type="eje" /></div>
                <div className="grid-value"><FormattedDiopter value={graduation.oiAdicion} type="adicion" /></div>
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
