import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';

const SystemCustomization = ({ onNavigate }) => {
    const { config, reloadConfig } = useConfig();
    const [formData, setFormData] = useState({
        id: null,
        nombreOptica: '',
        eslogan: '',
        colorPrimario: '#007bff',
        colorSecundario: '#6c757d',
        colorAcento: '#28a745',
        direccion: '',
        telefono: '',
        emailContacto: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Multi-tenant Root Logic
    const [isRoot, setIsRoot] = useState(false);
    const [schemas, setSchemas] = useState([]);
    const [targetTenant, setTargetTenant] = useState(''); // Empty = My own tenant

    // Check role and load schemas
    useEffect(() => {
        const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        if (roles.includes('Root')) {
            setIsRoot(true);
            fetchSchemas();
        }
    }, []);

    // Load config (reload when targetTenant changes)
    useEffect(() => {
        loadTargetConfig();
    }, [targetTenant, config]); // Reload if global config updates OR tenant changes

    const fetchSchemas = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/configuracion/schemas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const list = await res.json();
                setSchemas(list);
            }
        } catch (err) {
            console.error("Error fetching schemas", err);
        }
    };

    const loadTargetConfig = async () => {
        // If no target tenant selected (and not loaded default yet), use context config
        if (!targetTenant && config) {
            populateForm(config);
            return;
        }

        // If specific tenant selected, fetch IT
        if (targetTenant) {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/configuracion', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Tenant-ID': targetTenant
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    populateForm(data);
                } else {
                    // Reset if not found (new config)
                    populateForm({});
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    const populateForm = (data) => {
        setFormData(prev => ({
            ...prev,
            id: data.id || null,
            nombreOptica: data.nombreOptica || '',
            eslogan: data.eslogan || '',
            colorPrimario: data.colorPrimario || '#007bff',
            colorSecundario: data.colorSecundario || '#6c757d',
            colorAcento: data.colorAcento || '#28a745',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            emailContacto: data.emailContacto || ''
        }));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // Inject Override Header if Root selected a tenant
            if (targetTenant) {
                headers['X-Tenant-ID'] = targetTenant;
            }

            // Prepare payload - remove ID if null/empty to avoid 400 Bad Request
            const payload = { ...formData };
            if (!payload.id) {
                delete payload.id;
            }

            const response = await fetch('/api/configuracion', {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const updated = await response.json();
                setMessage({ type: 'success', text: `¡Configuración guardada para ${targetTenant || 'tu óptica'}!` });

                // Only reload global context if we edited OUR OWN tenant
                if (!targetTenant) {
                    if (reloadConfig) reloadConfig();
                }
            } else {
                setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error de conexión.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer', marginRight: '15px' }}>← Atrás</button>
                <h1 style={{ margin: 0, fontSize: '1.8em' }}>🎨 Personalizar Sistema</h1>
            </div>

            {/* ROOT SELECTOR */}
            {isRoot && (
                <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🛠️ [Root] Seleccionar Óptica a Editar:</label>
                    <select
                        value={targetTenant}
                        onChange={(e) => setTargetTenant(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #94a3b8' }}
                    >
                        <option value="">-- Mi Óptica Actual --</option>
                        {schemas.map(s => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            )}

            {message && (
                <div style={{
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontWeight: 'bold',
                    background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#86efac' : '#fecaca'}`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

                <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px', color: '#475569' }}>Identidad de Marca</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nombre de la Óptica</label>
                        <input type="text" name="nombreOptica" value={formData.nombreOptica} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Eslogan</label>
                        <input type="text" name="eslogan" value={formData.eslogan} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Teléfono</label>
                        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email Contacto</label>
                        <input type="text" name="emailContacto" value={formData.emailContacto} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Dirección Corta</label>
                        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                </div>

                <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px', color: '#475569' }}>Paleta de Colores</h3>

                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '20px' }}>

                    <div style={{ textAlign: 'center' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Principal</label>
                        <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #f1f5f9', margin: '0 auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            <input
                                type="color"
                                name="colorPrimario"
                                value={formData.colorPrimario}
                                onChange={handleChange}
                                style={{
                                    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                    padding: 0, margin: 0, border: 'none', cursor: 'pointer'
                                }}
                            />
                        </div>
                        <span style={{ display: 'block', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.9em', color: '#64748b' }}>{formData.colorPrimario}</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Secundario</label>
                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #f1f5f9', margin: '10px auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            <input
                                type="color"
                                name="colorSecundario"
                                value={formData.colorSecundario}
                                onChange={handleChange}
                                style={{
                                    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                    padding: 0, margin: 0, border: 'none', cursor: 'pointer'
                                }}
                            />
                        </div>
                        <span style={{ display: 'block', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.9em', color: '#64748b' }}>{formData.colorSecundario}</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Acento / Éxito</label>
                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #f1f5f9', margin: '10px auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            <input
                                type="color"
                                name="colorAcento"
                                value={formData.colorAcento}
                                onChange={handleChange}
                                style={{
                                    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                    padding: 0, margin: 0, border: 'none', cursor: 'pointer'
                                }}
                            />
                        </div>
                        <span style={{ display: 'block', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.9em', color: '#64748b' }}>{formData.colorAcento}</span>
                    </div>

                    <div style={{ flex: 1, padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9em', textTransform: 'uppercase', color: '#94a3b8' }}>Vista Previa de Botones</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button style={{
                                background: formData.colorPrimario,
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontWeight: '500'
                            }}>
                                Botón Primario
                            </button>
                            <button style={{
                                background: '#fff',
                                color: formData.colorSecundario,
                                border: `1px solid ${formData.colorSecundario}`,
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontWeight: '500'
                            }}>
                                Botón Secundario
                            </button>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <span style={{ color: formData.colorAcento, fontWeight: 'bold' }}>Texto de énfasis o éxito</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            background: '#0f172a',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '1em',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SystemCustomization;
