import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export const usePatientData = (patientId, initialTab = 'summary') => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(initialTab); // 'summary', 'consultations_lenses', 'consultations_medical', 'sales'

    const [consultations, setConsultations] = useState([]);
    const [sales, setSales] = useState([]);
    const [loadingTab, setLoadingTab] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshData = () => setRefreshTrigger(prev => prev + 1);

    // Fetch Patient Basic Data
    useEffect(() => {
        const fetchPatientDetails = async () => {
            if (!patientId) return;
            setLoading(true);
            try {
                const data = await apiClient.get(`/api/patients/${patientId}`);
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
                let url = '';
                if (activeTab === 'consultations_lenses') {
                    url = `/api/consultations/patient/${patientId}?tipo=consulta_lentes`;
                } else if (activeTab === 'consultations_medical') {
                    url = `/api/consultations/patient/${patientId}?tipo=consulta_medica`;
                } else if (activeTab === 'sales') {
                    url = `/api/sales/patient/${patientId}`;
                }

                if (!url) return;

                const data = await apiClient.get(url);

                if (activeTab === 'consultations_lenses' || activeTab === 'consultations_medical') {
                    setConsultations(data.items || (Array.isArray(data) ? data : []));
                } else if (activeTab === 'sales') {
                    setSales(data.items || (Array.isArray(data) ? data : []));
                }
            } catch (error) {
                console.error("Error loading tab data", error);
            } finally {
                setLoadingTab(false);
            }
        };

        fetchTabData();
    }, [activeTab, patientId, refreshTrigger]);

    return {
        patient,
        loading,
        error,
        activeTab,
        setActiveTab,
        consultations,
        sales,
        loadingTab,
        refreshData
    };
};
