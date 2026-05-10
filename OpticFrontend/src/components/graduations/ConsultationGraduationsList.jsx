import React from 'react';
import GraduationCard from '../common/GraduationCard';

const ConsultationGraduationsList = ({
    graduations,
    showForm,
    openAddForm,
    openEditForm,
    deletingId,
    setDeletingId,
    handleDelete,
    deleting,
    error
}) => {
    return (
        <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>
                    Lecturas Registradas
                </h3>
                {!showForm && (
                    <button className="btn-primary" style={{ fontSize: '0.875rem' }} onClick={openAddForm}>
                        + Nueva Graduación
                    </button>
                )}
            </div>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {graduations.length === 0 && !showForm ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👓</div>
                    <p style={{ color: '#94a3b8', marginBottom: '16px', fontWeight: '500' }}>
                        No hay graduaciones registradas para esta consulta.
                    </p>
                    <button className="btn-primary" onClick={openAddForm}>
                        + Agregar la primera graduación
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {graduations.map((g) => (
                        <div key={g.id} style={{ position: 'relative' }}>
                            <GraduationCard graduation={g} title={g.tipoGraduacion || 'Lectura'} />

                            {/* Delete confirmation overlay */}
                            {deletingId === g.id ? (
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    background: 'rgba(185,28,28,0.95)', borderRadius: '0 0 10px 10px',
                                    padding: '10px 14px', display: 'flex',
                                    justifyContent: 'space-between', alignItems: 'center', gap: '8px'
                                }}>
                                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>
                                        ¿Eliminar esta graduación?
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            style={{ background: '#fff', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '4px 12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
                                            onClick={() => handleDelete(g.id)}
                                            disabled={deleting}
                                        >
                                            {deleting ? '...' : 'Sí, eliminar'}
                                        </button>
                                        <button
                                            style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.7)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            onClick={() => setDeletingId(null)}
                                            disabled={deleting}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                        onClick={() => openEditForm(g)}
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button
                                        style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                        onClick={() => setDeletingId(g.id)}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConsultationGraduationsList;
