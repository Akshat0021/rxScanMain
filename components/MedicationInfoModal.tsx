import React from 'react';
import type { MedicationInfo } from '../types';
import { CloseIcon, InfoCircleIcon } from './icons';
import { Spinner } from './Spinner';

interface MedicationInfoModalProps {
    medicationName: string | null;
    medicationInfo: MedicationInfo | null;
    isLoading: boolean;
    onClose: () => void;
}

export const MedicationInfoModal: React.FC<MedicationInfoModalProps> = ({ 
    medicationName, medicationInfo, isLoading, onClose 
}) => {

    const renderContent = () => {
        if (isLoading) {
            return <Spinner message="Fetching information..." />;
        }
        if (!medicationInfo) {
            return <p className="text-center text-slate-500 dark:text-slate-400">No information available.</p>;
        }
        return (
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">Common Uses</h3>
                    <p>{medicationInfo.uses}</p>
                </div>
                <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">Potential Side Effects</h3>
                    <p>{medicationInfo.sideEffects}</p>
                </div>
                <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">Important Precautions</h3>
                    <p>{medicationInfo.precautions}</p>
                </div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            aria-labelledby="medication-info-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-lg p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 m-4 flex flex-col max-h-[80vh] animate-fade-in-down">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 id="medication-info-title" className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                        <InfoCircleIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                        About {medicationName || 'Medication'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto pr-2">
                    {renderContent()}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-yellow-800 dark:text-yellow-300 bg-yellow-100/50 dark:bg-yellow-900/30 p-3 rounded-lg flex-shrink-0">
                    <p><span className="font-bold">Disclaimer:</span> This AI-generated information is for educational purposes only and is not a substitute for professional medical advice. Always consult a healthcare provider.</p>
                </div>
            </div>
        </div>
    );
};