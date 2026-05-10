import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';

export const useSalesIndex = () => {
    // --- States ---
    const [activeTab, setActiveTab] = useState('notas'); // 'notas' | 'mostrador' | 'consultations' | 'descending' | 'range'
    const [sales, setSales] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Range Filter State
    const [startFolio, setStartFolio] = useState('');
    const [endFolio, setEndFolio] = useState('');
    
    // Modals
    const [showCounterModal, setShowCounterModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    // --- Effects ---
    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        if (activeTab === 'notas') {
            fetchSalesByYear(selectedYear);
        } else if (activeTab === 'mostrador') {
            fetchCounterSales();
        } else if (activeTab === 'consultations') {
            fetchConsultationSales();
        } else if (activeTab === 'descending') {
            fetchDescendingSales();
        } else if (activeTab === 'range') {
            if (startFolio && endFolio) fetchRangeSales(startFolio, endFolio);
            else setSales([]);
        }
    }, [activeTab, selectedYear]);

    // --- Fetching Logic ---
    const fetchYears = async () => {
        try {
            const years = await apiClient.get('/api/sales/years');
            setAvailableYears(years || [new Date().getFullYear()]);
            if (years && years.length > 0 && !years.includes(selectedYear)) {
                setSelectedYear(years[0]);
            }
        } catch (err) {
            console.error("Error fetching years:", err);
        }
    };

    const fetchSalesByYear = async (year) => {
        setLoading(true);
        try {
            const data = await apiClient.get(`/api/sales/year/${year}`);
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCounterSales = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/api/sales/counter');
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchConsultationSales = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/api/sales/consultations');
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDescendingSales = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/api/sales/descending');
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRangeSales = async (start, end) => {
        setLoading(true);
        try {
            const data = await apiClient.get(`/api/sales/range?start=${start}&end=${end}`);
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchTerm) {
            if (activeTab === 'notas') fetchSalesByYear(selectedYear);
            else if (activeTab === 'mostrador') fetchCounterSales();
            else if (activeTab === 'descending') fetchDescendingSales();
            else if (activeTab === 'range') {
                if (startFolio && endFolio) fetchRangeSales(startFolio, endFolio);
                else setSales([]);
            }
            else fetchConsultationSales();
            return;
        }

        let formattedSearchTerm = searchTerm.trim();
        if (/^\d{1,3}$/.test(formattedSearchTerm)) {
            formattedSearchTerm = formattedSearchTerm.padStart(4, '0');
            setSearchTerm(formattedSearchTerm);
        }

        setLoading(true);
        try {
            const data = await apiClient.get(`/api/sales/search?folio=${formattedSearchTerm}`);
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Action Handlers ---
    const handleAddCounterSale = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        const formData = new FormData(e.target);
        const payload = {
            concept: formData.get('concept'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            userId: authService.getUserId()
        };

        try {
            await apiClient.post('/api/sales/counter', payload);
            setShowCounterModal(false);
            if (activeTab === 'mostrador') fetchCounterSales();
        } catch (err) {
            setError("Error al registrar venta: " + err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleRegisterCancelled = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        const formData = new FormData(e.target);
        const payload = {
            folio: formData.get('folio'),
            date: formData.get('date'),
            userId: authService.getUserId()
        };

        try {
            await apiClient.post('/api/sales/cancel-folio', payload);
            setShowCancelModal(false);
            if (activeTab === 'notas') fetchSalesByYear(selectedYear);
        } catch (err) {
            setError("Error al registrar folio: " + err.message);
        } finally {
            setModalLoading(false);
        }
    };

    return {
        state: {
            activeTab, sales, availableYears, selectedYear, loading, error,
            searchTerm, startFolio, endFolio, showCounterModal, showCancelModal, modalLoading
        },
        actions: {
            setActiveTab, setSelectedYear, setSearchTerm, setStartFolio, setEndFolio,
            setShowCounterModal, setShowCancelModal,
            fetchSalesByYear, fetchCounterSales, fetchConsultationSales, fetchDescendingSales, fetchRangeSales,
            handleSearch, handleAddCounterSale, handleRegisterCancelled
        }
    };
};
