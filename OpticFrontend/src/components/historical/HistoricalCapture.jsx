import React, { useState } from 'react';
import { HistoricalCaptureProvider } from '../../context/HistoricalCaptureContext';
import HistoricalWizardModal from './wizard/HistoricalWizardModal';
import './HistoricalCapture.css';

const HistoricalCaptureContent = ({ onNavigate }) => {
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    return (
        <div className="historical-container animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2><span className="icon">📜</span> Captura Histórica de Notas</h2>
                <button
                    className="btn-primary"
                    onClick={() => setIsWizardOpen(true)}
                >
                    + Nueva Captura Histórica
                </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Módulo de Transición</h3>
                <p className="text-slate-500 max-w-2xl mx-auto mb-6">
                    Utilice este módulo exclusivo para registrar notas de venta físicas antiguas en el nuevo sistema digital.
                    El asistente paso a paso le pedirá los datos del paciente, la consulta, la graduación y los pagos realizados para mantener la integridad del expediente.
                </p>
                <button
                    className="btn-secondary"
                    onClick={() => setIsWizardOpen(true)}
                >
                    Iniciar Asistente de Captura ➜
                </button>
            </div>

            {isWizardOpen && (
                <HistoricalWizardModal
                    onNavigate={onNavigate}
                    onClose={() => setIsWizardOpen(false)}
                />
            )}
        </div>
    );
};

const HistoricalCapture = ({ onNavigate }) => {
    return (
        <HistoricalCaptureProvider onNavigate={onNavigate}>
            <HistoricalCaptureContent onNavigate={onNavigate} />
        </HistoricalCaptureProvider>
    );
};

export default HistoricalCapture;
