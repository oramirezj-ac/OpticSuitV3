import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';

const PatientHeader = ({ patient, onBack }) => {
    const isPresbyopicRisk = patient.edad && patient.edad >= 40;

    return (
        <div className="patient-header-card">
            <div className="patient-header-top">
                <button className="btn-back" onClick={onBack}>← Volver a Lista</button>
                <div className="patient-identity">
                    <h2>{patient.nombre} {patient.apellidoPaterno} {patient.apellidoMaterno}</h2>
                    <div className="patient-badges">
                        <span className="badge-age">{patient.edad ? `${patient.edad} Años` : 'Edad N/D'}</span>
                        {isPresbyopicRisk && <span className="badge-warning">⚠️ Revisar Adición</span>}
                        <span className={`badge-status ${patient.estaActivo ? 'active' : 'inactive'}`}>
                            {patient.estaActivo ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="patient-quick-info">
                <div className="info-item">
                    <span className="label">Teléfono:</span>
                    <span className="value">{patient.telefono || '-'}</span>
                </div>
                <div className="info-item">
                    <span className="label">Fecha Registro:</span>
                    <span className="value">
                        {formatDateLong(patient.fechaRegistro)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PatientHeader;
