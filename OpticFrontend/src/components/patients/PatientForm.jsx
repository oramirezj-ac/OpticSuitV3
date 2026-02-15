import React, { useState, useEffect } from 'react';
import './../users/UserForm.css'; // Reutilizamos estilos del modal
import { calculateAgeFromDate, calculateDateFromAge, formatDateForInput } from '../../utils/dateUtils';
import { checkDuplicates, createPatient, updatePatient } from '../../services/patientApi';

const PatientForm = ({ patient, onClose, onSuccess }) => {
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
        fechaRegistro: '', // New field for historical data capture
        estaActivo: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (patient) {
            setFormData({
                nombre: patient.nombre,
                apellidoPaterno: patient.apellidoPaterno || '',
                apellidoMaterno: patient.apellidoMaterno || '',
                telefono: patient.telefono || '',
                email: patient.email || '',
                direccion: patient.direccion || '',
                fechaNacimiento: patient.fechaNacimiento || '',
                edad: patient.edad || calculateAgeFromDate(patient.fechaNacimiento),
                ocupacion: patient.ocupacion || '',
                notas: patient.notas || '',
                fechaRegistro: formatDateForInput(patient.fechaRegistro),
                estaActivo: patient.estaActivo
            });
        } else {
            // Default to today for new patients, but allow change
            setFormData(prev => ({ ...prev, fechaRegistro: new Date().toISOString().split('T')[0] }));
        }
    }, [patient]);

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

    const [duplicates, setDuplicates] = useState(null);

    const handleSubmit = async (e, forceCreate = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = { ...formData };
            delete payload.edad;
            if (!payload.fechaNacimiento) payload.fechaNacimiento = null;

            // Check for duplicates only when creating new patient and not forcing creation
            if (!patient && !forceCreate) {
                const foundDuplicates = await checkDuplicates(payload);
                if (foundDuplicates && foundDuplicates.length > 0) {
                    setDuplicates(foundDuplicates);
                    setLoading(false);
                    return; // Stop here and show duplicates
                }
            }

            // Create or update patient
            if (patient) {
                await updatePatient(patient.id, payload);
            } else {
                await createPatient(payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            // Only stop loading if we didn't return early for duplicates
            if (!duplicates) setLoading(false);
        }
    };

    const handleUseExisting = async (existingPatient) => {
        try {
            // Check if we need to update the date to an older one
            if (formData.fechaRegistro && existingPatient.fechaRegistro) {
                const newDate = new Date(formData.fechaRegistro);
                const oldDate = new Date(existingPatient.fechaRegistro);

                // Compare timestamps, if new date is older (smaller timestamp)
                if (newDate < oldDate) {
                    // Construct update payload using existing patient data but with new date
                    const updatePayload = {
                        nombre: existingPatient.nombre,
                        apellidoPaterno: existingPatient.apellidoPaterno,
                        apellidoMaterno: existingPatient.apellidoMaterno,
                        telefono: existingPatient.telefono,
                        email: existingPatient.email,
                        direccion: existingPatient.direccion,
                        fechaNacimiento: existingPatient.fechaNacimiento,
                        ocupacion: existingPatient.ocupacion,
                        notas: existingPatient.notas,
                        fechaRegistro: formData.fechaRegistro, // The new older date
                        estaActivo: existingPatient.estaActivo
                    };

                    await updatePatient(existingPatient.id, updatePayload);

                    // Trigger success to refresh lists if needed
                    if (onSuccess) onSuccess();
                }
            }
        } catch (e) {
            console.error("Error updating patient date on duplicate select", e);
        } finally {
            onClose();
        }
    };

    // Style for spacing inputs
    const colStyle = { padding: '5px' };

    if (duplicates) {
        return (
            <div className="modal-overlay">
                <div className="modal-card" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <div className="modal-header">
                        <h3>Posibles Duplicados Encontrados</h3>
                        <button className="btn-close" onClick={() => setDuplicates(null)}>&times;</button>
                    </div>
                    <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
                        <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#0369a1' }}>Datos que intenta registrar:</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                <strong>Nombre:</strong> {formData.nombre} {formData.apellidoPaterno} {formData.apellidoMaterno}<br />
                                <strong>Teléfono:</strong> {formData.telefono || 'N/A'}<br />
                                <strong>Dirección:</strong> {formData.direccion || 'N/A'}
                            </p>
                        </div>

                        <div className="alert alert-warning">
                            Se encontraron pacientes similares. ¿Desea usar alguno de estos o crear uno nuevo?
                        </div>
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Teléfono</th>
                                    <th>Dirección</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicates.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.nombre} {d.apellidoPaterno} {d.apellidoMaterno}</td>
                                        <td>{d.telefono}</td>
                                        <td>{d.direccion}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                                onClick={() => handleUseExisting(d)}
                                            >
                                                Usar este
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={() => setDuplicates(null)}>Regresar</button>
                        <button type="button" className="btn-primary" onClick={(e) => handleSubmit(e, true)}>
                            Crear como Nuevo (Ignorar duplicados)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Style for spacing inputs


    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h3>{patient ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="form-row">
                            <div className="form-group col" style={colStyle}>
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    className="form-input"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nombre(s)"
                                />
                            </div>
                            <div className="form-group col" style={colStyle}>
                                <label>Apellido Paterno</label>
                                <input
                                    type="text"
                                    name="apellidoPaterno"
                                    className="form-input"
                                    value={formData.apellidoPaterno}
                                    onChange={handleChange}
                                    placeholder="Apellido Paterno"
                                />
                            </div>
                        </div>

                        <div className="form-row" style={{ alignItems: 'end' }}>
                            <div className="form-group col" style={colStyle}>
                                <label>Apellido Materno</label>
                                <input
                                    type="text"
                                    name="apellidoMaterno"
                                    className="form-input"
                                    value={formData.apellidoMaterno}
                                    onChange={handleChange}
                                    placeholder="Apellido Materno"
                                />
                            </div>
                            <div className="form-group col" style={colStyle}>
                                <label>Fecha Nacimiento</label>
                                <input
                                    type="date"
                                    name="fechaNacimiento"
                                    className="form-input"
                                    value={formData.fechaNacimiento}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group col" style={{ ...colStyle, flex: '0 0 80px' }}>
                                <label>Edad</label>
                                <input
                                    type="number"
                                    name="edad"
                                    className="form-input"
                                    value={formData.edad}
                                    onChange={handleChange}
                                    placeholder="Aprox"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group col" style={colStyle}>
                                <label>Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    className="form-input"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group col" style={colStyle}>
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    className="form-input"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group col" style={colStyle}>
                                <label>Ocupación</label>
                                <input
                                    type="text"
                                    name="ocupacion"
                                    className="form-input"
                                    value={formData.ocupacion}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group col" style={colStyle}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group col" style={{ ...colStyle, maxWidth: '200px' }}>
                                <label>Fecha Registro (Histórica)</label>
                                <input
                                    type="date"
                                    name="fechaRegistro"
                                    className="form-input"
                                    value={formData.fechaRegistro}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={colStyle}>
                            <label>Notas / Antecedentes</label>
                            <textarea
                                name="notas"
                                className="form-input"
                                value={formData.notas}
                                onChange={handleChange}
                                rows="3"
                            />
                        </div>

                        {patient && (
                            <div className="form-group checkbox-group" style={colStyle}>
                                <label>
                                    <input
                                        type="checkbox"
                                        name="estaActivo"
                                        checked={formData.estaActivo}
                                        onChange={handleChange}
                                    />
                                    Paciente Activo
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Paciente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PatientForm;
