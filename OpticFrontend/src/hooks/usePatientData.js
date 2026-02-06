import { useState, useEffect } from 'react';

export const usePatientData = (patientId) => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'consultations', 'sales'

    const [consultations, setConsultations] = useState([]);
    const [sales, setSales] = useState([]);
    const [loadingTab, setLoadingTab] = useState(false);

    // Fetch Patient Basic Data
    useEffect(() => {
        const fetchPatientDetails = async () => {
            if (!patientId) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                // Note: In a real app, use a configured axios instance or fetch wrapper
                const response = await fetch(`/api/patients/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error al cargar expediente');

                const data = await response.json();
                setPatient(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientDetails();
    }, [patientId]);

    // Fetch Tab Data
    useEffect(() => {
        const fetchTabData = async () => {
            if (activeTab === 'summary' || !patientId) return;

            setLoadingTab(true);
            try {
                const token = localStorage.getItem('token');
                let url = '';
                if (activeTab === 'consultations') {
                    url = `/api/consultations/patient/${patientId}`;
                } else if (activeTab === 'sales') {
                    url = `/api/sales/patient/${patientId}`;
                }

                if (!url) return;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();

                    if (activeTab === 'consultations') {
                        setConsultations(data.items || (Array.isArray(data) ? data : []));
                    } else if (activeTab === 'sales') {
                        setSales(data.items || (Array.isArray(data) ? data : []));
                    }
                }
            } catch (error) {
                console.error("Error loading tab data", error);
            } finally {
                setLoadingTab(false);
            }
        };

        fetchTabData();
    }, [activeTab, patientId]);

    return {
        patient,
        loading,
        error,
        activeTab,
        setActiveTab,
        consultations,
        sales,
        loadingTab
    };
};
