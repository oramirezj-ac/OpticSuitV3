import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';

export const useConsultationCreate = (params, onNavigate) => {
    // Selection state
    const [selectionTab, setSelectionTab] = useState('recent');
    const [recentPatients, setRecentPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(params?.patientId ? { id: params.patientId, nombre: params.patientName } : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Form state
    const [tipoConsulta, setTipoConsulta] = useState(params?.type || 'consulta_lentes');
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        motivoConsulta: '',
        observaciones: '',
        diagnostico: '',
        tratamiento: '',
        costoServicio: (params?.type === 'consulta_medica' || tipoConsulta === 'consulta_medica') ? 300 : 0
    });

    // Pharmacy state (Medical only)
    const [selectedProducts, setSelectedProducts] = useState([]);
    const pharmacyCatalog = [
        { id: 'hipromelosa', name: 'Hipromelosa', price: 100, reason: 'Ojo Seco' },
        { id: 'splash', name: 'Splash', price: 200, reason: 'Ojo Seco' },
        { id: 'hamamelis', name: 'Hamamelis', price: 300, reason: 'Carnosidad' },
        { id: 'ocurelift', name: 'Ocurelift', price: 100, reason: 'Ojo Rojo' }
    ];

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [metodoPago, setMetodoPago] = useState('Efectivo');

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            costoServicio: tipoConsulta === 'consulta_medica' ? 300 : 0
        }));
    }, [tipoConsulta]);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const response = await apiClient.get('/api/patients?pageSize=5');
                setRecentPatients(response.items || []);
            } catch (err) {
                console.error("Error fetching recent patients:", err);
            }
        };
        fetchRecent();
    }, []);

    useEffect(() => {
        if (!form.motivoConsulta) {
            setForm(prev => ({
                ...prev,
                motivoConsulta: tipoConsulta === 'consulta_lentes' ? 'Revisar graduación' : 'Revisión Médica'
            }));
        }
    }, [tipoConsulta]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/patients?search=${searchQuery}&pageSize=10`);
            setSearchResults(response.items || []);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleProduct = (prod) => {
        if (selectedProducts.find(p => p.id === prod.id)) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== prod.id));
        } else {
            setSelectedProducts([...selectedProducts, prod]);
        }
    };

    const calculateTotal = () => {
        const productTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
        return parseFloat(form.costoServicio || 0) + productTotal;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedPatient) {
            setError("Por favor seleccione un paciente");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const detallesClinicos = tipoConsulta === 'consulta_medica' ? {
                diagnostico: form.diagnostico,
                tratamiento: form.tratamiento,
                productos: selectedProducts.map(p => p.name).join(', ')
            } : {};

            const total = calculateTotal();

            const payload = {
                pacienteId: selectedPatient.id,
                fecha: form.fecha ? new Date(form.fecha + 'T00:00:00Z').toISOString() : new Date().toISOString(),
                tipoConsulta,
                motivoConsulta: form.motivoConsulta,
                observaciones: form.observaciones,
                costoServicio: total,
                estadoFinanciero: total > 0 ? 'pagado' : 'completo',
                detallesClinicos
            };

            const response = await apiClient.post('/api/consultations', payload);
            
            // AUTOMATIC SALE CREATION if total > 0
            if (total > 0) {
                const now = new Date();
                const timestamp = now.getFullYear() + 
                                String(now.getMonth() + 1).padStart(2, '0') + 
                                String(now.getDate()).padStart(2, '0') + "-" +
                                String(now.getHours()).padStart(2, '0') + 
                                String(now.getMinutes()).padStart(2, '0');
                
                const prefix = tipoConsulta === 'consulta_medica' ? 'MED-' : 'CL-';

                const salePayload = {
                    pacienteId: selectedPatient.id,
                    consultaId: response.id,
                    folioFisico: `${prefix}${timestamp}`,
                    totalVenta: total,
                    saldoPendiente: 0, // Fully paid
                    observacionesGenerales: `Cobro por ${tipoConsulta === 'consulta_medica' ? 'Consulta Médica' : 'Graduación'}`,
                    usuarioId: null,
                    detalles: [
                        { descripcion: `${tipoConsulta === 'consulta_medica' ? 'Consulta Médica' : 'Graduación'}: ${form.motivoConsulta}`, cantidad: 1, precioAplicado: parseFloat(form.costoServicio || 0) },
                        ...selectedProducts.map(p => ({
                            descripcion: `Farmacia: ${p.name}`,
                            cantidad: 1,
                            precioAplicado: p.price
                        }))
                    ],
                    abonosIniciales: [
                        { monto: total, metodoPago: metodoPago, fechaPago: new Date().toISOString(), usuarioId: null }
                    ]
                };
                await apiClient.post('/api/sales', salePayload);
            }

            setShowSuccess(true);
            setTimeout(() => {
                if (tipoConsulta === 'consulta_lentes' && params?.patientId) {
                    onNavigate('consultation-graduations', {
                        consultationId: response.id,
                        patientId: params.patientId
                    });
                } else if (params?.patientId) {
                    onNavigate('patient-details', { patientId: params.patientId });
                } else {
                    onNavigate('consultations');
                }
            }, 2000);
        } catch (err) {
            console.error("Error saving consultation:", err);
            setError(err.message || "Error al guardar la consulta");
        } finally {
            setLoading(false);
        }
    };

    return {
        state: {
            selectionTab, recentPatients, selectedPatient, searchQuery, searchResults,
            tipoConsulta, form, selectedProducts, pharmacyCatalog,
            loading, showSuccess, error, metodoPago
        },
        actions: {
            setSelectionTab, setSelectedPatient, setSearchQuery, setTipoConsulta,
            setForm, setMetodoPago, handleSearch, handleFormChange, toggleProduct,
            calculateTotal, handleSave
        }
    };
};
