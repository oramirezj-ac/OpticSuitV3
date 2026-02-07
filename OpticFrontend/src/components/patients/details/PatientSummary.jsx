import React from 'react';
import { formatPhoneNumber } from '../../../utils/formatUtils';

const PatientSummary = ({ patient }) => {
    return (
        <div className="summary-view">
            {/* Ficha Técnica Limpia y Compacta */}
            <div className="patient-data-sheet">
                <h4 style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Datos Generales</h4>
                <div className="data-grid">
                    {patient.ocupacion && (
                        <div className="data-item">
                            <label>Ocupación</label>
                            <span>{patient.ocupacion}</span>
                        </div>
                    )}
                    {patient.edad && (
                        <div className="data-item">
                            <label>Edad</label>
                            <span>{patient.edad} Años</span>
                        </div>
                    )}

                    {patient.telefono && (
                        <div className="data-item">
                            <label>Teléfono</label>
                            <span>{formatPhoneNumber(patient.telefono)}</span>
                        </div>
                    )}
                    {patient.email && (
                        <div className="data-item">
                            <label>Email</label>
                            <span>{patient.email}</span>
                        </div>
                    )}

                    {patient.direccion && (
                        <div className="data-item" style={{ gridColumn: 'span 2' }}>
                            <label>Dirección</label>
                            <span>{patient.direccion}</span>
                        </div>
                    )}
                </div>
            </div>

            {patient.notas && patient.notas.trim() !== '' && (
                <div className="notes-section" style={{ marginTop: '30px' }}>
                    <h4 style={{ color: '#475569' }}>Notas / Antecedentes</h4>
                    <div className="notes-box">
                        {patient.notas}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientSummary;
