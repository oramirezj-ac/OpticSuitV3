import React, { useState, useEffect } from 'react';
import { formatDateLong } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatUtils';
import { apiClient } from '../../../services/apiClient';

const RecentConsultations = ({ onNavigate, tipoConsulta, title }) => {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecent = async () => {
            setLoading(true);
            try {
                // Fetch using the type filter if provided
                const url = tipoConsulta 
                    ? `/api/consultations/recent?count=15&tipo=${tipoConsulta}`
                    : '/api/consultations/recent?count=15';
                const data = await apiClient.get(url);
                setConsultations(data || []);
            } catch (err) {
                console.error("Failed to load consultations:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecent();
    }, [tipoConsulta]);

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{title || 'Últimas 15 Consultas'}</h3>

            {consultations.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                    <p className="text-muted mb-2">No hay consultas recientes en el sistema.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Paciente</th>
                                <th>Motivo / Tipo</th>
                                <th>Costo</th>
                                <th>Estatus Fin.</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consultations.map(c => {
                                const isPagado = c.estadoFinanciero?.toLowerCase() === 'pagado';
                                return (
                                    <tr key={c.id}>
                                        <td className="font-medium text-slate-700">{formatDateLong(c.fecha)}</td>
                                        <td className="font-bold text-slate-800">
                                            {c.paciente ? `${c.paciente.nombre} ${c.paciente.apellidoPaterno || ''}` : 'Desconocido'}
                                        </td>
                                        <td className="text-slate-600">{c.motivoConsulta || 'Consulta General'}</td>
                                        <td className="font-mono">{formatCurrency(c.costoServicio)}</td>
                                        <td>
                                            <span className={`badge ${isPagado ? 'badge-success' : 'badge-warning'}`}>
                                                {c.estadoFinanciero?.toUpperCase() || 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button
                                                    className="btn-secondary text-xs"
                                                    title="Ver Expediente"
                                                    onClick={() => onNavigate('patient-details', { patientId: c.pacienteId })}
                                                >
                                                    📂
                                                </button>
                                                {!isPagado && (
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {c.tipoConsulta === 'consulta_lentes' && (
                                                            <button
                                                                className="btn-icon text-xs"
                                                                title="Gestionar Graduaciones"
                                                                style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
                                                                onClick={() => onNavigate('consultation-graduations', { 
                                                                    patientId: c.pacienteId, 
                                                                    patientName: c.paciente ? `${c.paciente.nombre} ${c.paciente.apellidoPaterno || ''}` : 'Paciente',
                                                                    consultationId: c.id 
                                                                })}
                                                            >
                                                                👓
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-primary text-xs"
                                                            title="Cobrar Consulta / Generar Venta"
                                                            onClick={() => onNavigate('sales-create', { 
                                                                patientId: c.pacienteId, 
                                                                consultationId: c.id,
                                                                totalAmount: c.costoServicio,
                                                                type: c.tipoConsulta
                                                            })}
                                                        >
                                                            💰
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    className="btn-icon"
                                                    title="Editar Consulta"
                                                    onClick={() => onNavigate('consultation-edit', { id: c.id })}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    style={{ color: '#ef4444' }}
                                                    title="Eliminar Consulta"
                                                    onClick={() => onNavigate('consultation-delete', { consultationId: c.id, patientId: c.pacienteId })}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RecentConsultations;
