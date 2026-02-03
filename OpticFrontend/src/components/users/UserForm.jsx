import React, { useState, useEffect } from 'react';
import './UserForm.css';

const UserForm = ({ user, onClose, onSuccess, isRoot }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombreCompleto: '',
        rol: 'Vendedor',
        nombreEsquema: '', // Solo para Root
        estaActivo: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state setup for Edit Mode
    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                password: '', // Leave blank to keep current
                nombreCompleto: user.nombreCompleto,
                rol: user.rol,
                nombreEsquema: user.nombreEsquema || '',
                estaActivo: user.estaActivo
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const method = user ? 'PUT' : 'POST';
            const url = user ? `/api/users/${user.id}` : '/api/users';

            // Clean data for submission
            const payload = { ...formData };
            if (user && !payload.password) delete payload.password; // Don't send empty password on update

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || (errData[0]?.description) || 'Error al guardar usuario');
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div className="modal-header">
                    <h3>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input
                                type="text"
                                name="nombreCompleto"
                                className="form-input"
                                value={formData.nombreCompleto}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={!!user} // Email cannot be changed (Identity User key)
                            />
                        </div>

                        {(!user || isRoot) && (
                            <div className="form-group">
                                <label>Contraseña {user && <small>(Dejar en blanco para no cambiar)</small>}</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!user} // Required only for new users
                                />
                            </div>
                        )}

                        <div className="form-row">
                            {/* Check if editing self */}
                            {user && user.email === localStorage.getItem('userEmail') ? (
                                /* Hidden field for self-edit to prevent role change */
                                <div className="form-group col" style={{ display: 'none' }}>
                                    <input type="hidden" name="rol" value={formData.rol} />
                                </div>
                            ) : (
                                <div className="form-group col">
                                    <label>Rol</label>
                                    <select
                                        name="rol"
                                        className="form-input"
                                        value={formData.rol}
                                        onChange={handleChange}
                                    >
                                        <option value="Vendedor">Vendedor</option>
                                        <option value="Admin">Administrador</option>
                                        {isRoot && <option value="Root">Root (Super Usuario)</option>}
                                    </select>
                                </div>
                            )}

                            {isRoot && (
                                <div className="form-group col">
                                    <label>Schema (Sucursal)</label>
                                    <select
                                        name="nombreEsquema"
                                        className="form-input"
                                        value={formData.nombreEsquema}
                                        onChange={handleChange}
                                    >
                                        <option value="public">public (Global)</option>
                                        <option value="public_test">public_test</option>
                                        {/* Add dynamic schemas later */}
                                    </select>
                                </div>
                            )}
                        </div>

                        {user && (
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="estaActivo"
                                        checked={formData.estaActivo}
                                        onChange={handleChange}
                                    />
                                    Usuario Activo
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
