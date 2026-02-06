import React, { useState, useEffect } from 'react';
import './HistoricalCapture.css'; // Reutilizamos estilos del contenedor de captura

const HistoricalPatientForm = ({ onPatientSelected }) => {
    // Estado del formulario independiente
    const [formData, setFormData] = useState({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        telefono: '',
        email: '',
        direccion: '',
        fechaNacimiento: '',
        edad: '',
        ocupacion: '',
        notas: '',
        fechaRegistro: new Date().toISOString().split('T')[0], // Por defecto hoy
        estaActivo: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [duplicates, setDuplicates] = useState(null);

    // Helpers de edad (Duplicados para independencia total)
    const calculateAgeFromDate = (dateString) => {
        if (!dateString) return '';
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const calculateDateFromAge = (age) => {
        if (!age) return '';
        const today = new Date();
        const year = today.getFullYear() - parseInt(age);
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        let newFormData = { ...formData, [name]: val };

        if (name === 'fechaNacimiento') {
            newFormData.edad = calculateAgeFromDate(val);
        } else if (name === 'edad') {
            newFormData.fechaNacimiento = calculateDateFromAge(val);
        }

        setFormData(newFormData);
    };

    const handleSubmit = async (e, forceCreate = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const url = '/api/patients';
            const payload = { ...formData };
            delete payload.edad; // No se envía al backend
            if (!payload.fechaNacimiento) payload.fechaNacimiento = null;

            // 1. Detección de duplicados (Solo si no estamos forzando creación)
            if (!forceCreate) {
                const checkUrl = '/api/patients/check-duplicates';
                const checkRes = await fetch(checkUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });

                if (checkRes.ok) {
                    const foundDuplicates = await checkRes.json();
                    if (foundDuplicates && foundDuplicates.length > 0) {
                        setDuplicates(foundDuplicates);
                        setLoading(false);
                        return; // Detiene el flujo para mostrar duplicados
                    }
                }
            }

            // 2. Creación del Paciente
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Error al guardar paciente');
            }

            const createdPatient = await response.json();

            // Éxito: Pasamos el paciente creado al padre
            onPatientSelected(createdPatient, formData.fechaRegistro);

        } catch (err) {
            console.error(err);
            setError(err.message || "Error desconocido");
        } finally {
            if (!duplicates) setLoading(false);
        }
    };

    const handleUseExisting = async (existingPatient) => {
        try {
            setLoading(true);
            // Lógica de "Actualización Retroactiva" (Backdated Update)
            if (formData.fechaRegistro && existingPatient.fechaRegistro) {
                const newDate = new Date(formData.fechaRegistro);
                const oldDate = new Date(existingPatient.fechaRegistro);

                if (newDate < oldDate) {
                    const token = localStorage.getItem('token');
                    const updatePayload = {
                        ...existingPatient, // Usamos datos existentes
                        fechaRegistro: formData.fechaRegistro // Solo cambiamos la fecha por la más antigua
                    };
                    // Limpiamos campos que no deben ir en PUT si vienen del objeto completo (como id, audit fields, etc)
                    // Asumimos que el backend maneja DTO limpio, pero por seguridad enviamos payload limpio
                    const cleanPayload = {
                        nombre: existingPatient.nombre,
                        apellidoPaterno: existingPatient.apellidoPaterno,
                        apellidoMaterno: existingPatient.apellidoMaterno,
                        telefono: existingPatient.telefono,
                        email: existingPatient.email,
                        direccion: existingPatient.direccion,
                        fechaNacimiento: existingPatient.fechaNacimiento,
                        ocupacion: existingPatient.ocupacion,
                        notas: existingPatient.notas,
                        fechaRegistro: formData.fechaRegistro,
                        estaActivo: existingPatient.estaActivo
                    };

                    await fetch(`/api/patients/${existingPatient.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(cleanPayload)
                    });
                }
            }
            // Pasamos el paciente existente (con o sin fecha actualizada)
            // Y avisamos de la fecha prioritaria si se usó la del formulario
            onPatientSelected(existingPatient, formData.fechaRegistro);
        } catch (e) {
            console.error("Error al usar existente", e);
            setError("Error al procesar paciente existente");
        } finally {
            setLoading(false);
            setDuplicates(null);
        }
    };

    // Render de Duplicados (Modal interno o en sitio)
    if (duplicates) {
        return (
            <div className="duplicates-panel">
                <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#0369a1' }}>Datos que intenta registrar:</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        <strong>Nombre:</strong> {formData.nombre} {formData.apellidoPaterno}<br />
                        <strong>Registro:</strong> {formData.fechaRegistro}
                    </p>
                </div>
                <div className="alert alert-warning">
                    ⚠️ Pacientes similares encontrados. ¿Desea usar uno de estos?
                </div>
                <div className="duplicates-list">
                    {duplicates.map(d => (
                        <div key={d.id} className="duplicate-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <div>
                                <strong>{d.nombre} {d.apellidoPaterno} {d.apellidoMaterno}</strong><br />
                                <small>{d.telefono} | {d.direccion}</small>
                            </div>
                            <button className="btn-secondary" onClick={() => handleUseExisting(d)}>Usar Este</button>
                        </div>
                    ))}
                </div>
                <div className="form-actions">
                    <button className="btn-secondary" onClick={() => setDuplicates(null)}>Cancelar</button>
                    <button className="btn-primary" onClick={(e) => handleSubmit(e, true)}>Ignorar y Crear Nuevo</button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="historical-patient-form">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-row">
                <div className="form-group">
                    <label>Nombre *</label>
                    <input type="text" name="nombre" className="form-input" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Apellido Paterno</label>
                    <input type="text" name="apellidoPaterno" className="form-input" value={formData.apellidoPaterno} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Apellido Materno</label>
                    <input type="text" name="apellidoMaterno" className="form-input" value={formData.apellidoMaterno} onChange={handleChange} />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" name="telefono" className="form-input" value={formData.telefono} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Dirección</label>
                    <input type="text" name="direccion" className="form-input" value={formData.direccion} onChange={handleChange} />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Fecha Nacimiento</label>
                    <input type="date" name="fechaNacimiento" className="form-input" value={formData.fechaNacimiento} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ maxWidth: '100px' }}>
                    <label>Edad</label>
                    <input type="number" name="edad" className="form-input" value={formData.edad} onChange={handleChange} placeholder="Calc" />
                </div>
                <div className="form-group">
                    <label style={{ color: '#6366f1' }}>📅 Fecha de Nota (Registro)</label>
                    <input
                        type="date"
                        name="fechaRegistro"
                        className="form-input"
                        value={formData.fechaRegistro}
                        onChange={handleChange}
                        style={{ borderColor: '#6366f1', borderWidth: '2px' }}
                    />
                    <small style={{ color: '#64748b' }}>Use la fecha de la nota física</small>
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Procesando...' : 'Guardar y Continuar →'}
                </button>
            </div>
        </form>
    );
};

export default HistoricalPatientForm;
