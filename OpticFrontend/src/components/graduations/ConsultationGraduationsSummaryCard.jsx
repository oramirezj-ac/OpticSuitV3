import React from 'react';
import { formatDateLong } from '../../utils/dateUtils';

const ConsultationGraduationsSummaryCard = ({ consultation, graduationsCount }) => {
    if (!consultation) return null;

    const summaryItems = [
        { label: 'Fecha', value: formatDateLong(consultation.fecha) },
        { label: 'Motivo', value: consultation.motivoConsulta },
        { label: 'Tipo', value: consultation.tipoConsulta === 'consulta_lentes' ? 'Consulta por Lentes' : 'Consulta Médica', color: '#3b82f6' },
        { label: 'Graduaciones', value: `${graduationsCount} registrada${graduationsCount !== 1 ? 's' : ''}`, color: graduationsCount > 0 ? '#10b981' : '#94a3b8' }
    ];

    return (
        <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px'
        }}>
            {summaryItems.map(({ label, value, color }) => (
                <div key={label}>
                    <div style={{ 
                        fontSize: '0.72rem', 
                        color: '#64748b', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.06em', 
                        marginBottom: '2px' 
                    }}>
                        {label}
                    </div>
                    <div style={{ fontWeight: '600', color: color || '#1e293b' }}>
                        {value}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ConsultationGraduationsSummaryCard;
