import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

export const EMPTY_FORM = {
    tipoGraduacion: 'Final',
    od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '',
    oi_esfera: '', oi_cilindro: '', oi_eje: '', oi_adicion: '',
    dp: ''
};

export const TIPOS = ['Autoref', 'Rx Anterior', 'Phoroptor', 'Rx Externa', 'Final'];

export const useConsultationGraduations = (consultationId) => {
    const [consultation, setConsultation] = useState(null);
    const [graduations, setGraduations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form (Add / Edit)
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [savingForm, setSavingForm] = useState(false);
    const [formError, setFormError] = useState(null);

    // Success notification
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Delete confirmation
    const [deletingId, setDeletingId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadConsultation();
    }, [consultationId]);

    const loadConsultation = async () => {
        if (!consultationId) {
            setError('No se especificó una consulta.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get(`/api/consultations/${consultationId}`);
            setConsultation(data);
            setGraduations(data.graduaciones || []);
        } catch (err) {
            setError(err.message || 'Error al cargar la consulta');
        } finally {
            setLoading(false);
        }
    };

    const parseNum = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
    };

    const parseIntVal = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const n = parseInt(val, 10);
        return isNaN(n) ? null : n;
    };

    const buildPayload = () => ({
        tipoGraduacion: form.tipoGraduacion,
        odEsfera: parseNum(form.od_esfera),
        odCilindro: parseNum(form.od_cilindro),
        odEje: parseIntVal(form.od_eje),
        odAdicion: parseNum(form.od_adicion),
        oiEsfera: parseNum(form.oi_esfera),
        oiCilindro: parseNum(form.oi_cilindro),
        oiEje: parseIntVal(form.oi_eje),
        oiAdicion: parseNum(form.oi_adicion),
        detallesMontaje: { dp: form.dp, av_od: '', av_oi: '' }
    });

    const showNotification = (msg) => {
        setSuccessMsg(msg);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const openAddForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setFormError(null);
        setShowForm(true);
        setTimeout(() => document.getElementById('grad-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const openEditForm = (grad) => {
        const getDp = () => {
            try {
                const dm = typeof grad.detallesMontaje === 'string'
                    ? JSON.parse(grad.detallesMontaje)
                    : grad.detallesMontaje;
                return dm?.dp ?? '';
            } catch { return ''; }
        };
        setForm({
            tipoGraduacion: grad.tipoGraduacion || 'Final',
            od_esfera: grad.odEsfera ?? '',
            od_cilindro: grad.odCilindro ?? '',
            od_eje: grad.odEje ?? '',
            od_adicion: grad.odAdicion ?? '',
            oi_esfera: grad.oiEsfera ?? '',
            oi_cilindro: grad.oiCilindro ?? '',
            oi_eje: grad.oiEje ?? '',
            oi_adicion: grad.oiAdicion ?? '',
            dp: getDp()
        });
        setEditingId(grad.id);
        setFormError(null);
        setShowForm(true);
        setTimeout(() => document.getElementById('grad-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormError(null);
    };

    const handleGradChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSavingForm(true);
        setFormError(null);
        try {
            if (editingId) {
                const updated = await apiClient.put(`/api/consultations/graduations/${editingId}`, buildPayload());
                setGraduations(prev => prev.map(g => g.id === editingId ? { ...g, ...updated } : g));
                showNotification('Graduación actualizada correctamente');
            } else {
                const created = await apiClient.post(`/api/consultations/${consultationId}/graduations`, buildPayload());
                setGraduations(prev => [...prev, created]);
                showNotification('Graduación guardada correctamente');
            }
            cancelForm();
        } catch (err) {
            setFormError(err.message || 'Error al guardar la graduación');
        } finally {
            setSavingForm(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await apiClient.delete(`/api/consultations/graduations/${id}`);
            setGraduations(prev => prev.filter(g => g.id !== id));
            setDeletingId(null);
            showNotification('Graduación eliminada');
        } catch (err) {
            setError(err.message || 'Error al eliminar la graduación');
        } finally {
            setDeleting(false);
        }
    };

    return {
        state: {
            consultation, graduations, loading, error,
            showForm, editingId, form, savingForm, formError,
            showSuccess, successMsg, deletingId, deleting
        },
        actions: {
            openAddForm, openEditForm, cancelForm, handleGradChange, handleSave,
            handleDelete, setDeletingId, setForm
        }
    };
};
