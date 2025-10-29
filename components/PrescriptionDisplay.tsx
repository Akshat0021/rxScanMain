import React from 'react';
import type { PrescriptionData, Medication } from '../types';
import { UserIcon, DoctorIcon, CalendarIcon, DiagnosisIcon, PlusIcon, TrashIcon, TranslateIcon, BellIcon, ButtonSpinnerIcon, InfoCircleIcon } from './icons';

interface PrescriptionDisplayProps {
  data: PrescriptionData;
  setData: React.Dispatch<React.SetStateAction<PrescriptionData | null>>;
  onSetReminder: (medication: Medication) => void;
  onShowMedicationInfo: (medicationName: string) => void;
  onTranslate: (language: string) => void;
  isTranslating: boolean;
  isTranslated: boolean;
  onRevertTranslation: () => void;
}

const LANGUAGES = {
    'Hindi': 'hi',
    'Tamil': 'ta',
    'Bengali': 'bn',
    'Marathi': 'mr',
    'Telugu': 'te',
};

const EditableInfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  field: keyof PrescriptionData;
  onChange: (field: keyof PrescriptionData, value: string) => void;
}> = ({ icon, label, value, field, onChange }) => (
    <div className="p-4 bg-white/60 dark:bg-slate-800/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <label className="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center mb-1">
            <div className="flex-shrink-0 mr-2">{icon}</div>
            {label}
        </label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full text-md font-semibold text-gray-800 dark:text-slate-100 bg-transparent focus:outline-none"
        />
    </div>
);

export const PrescriptionDisplay: React.FC<PrescriptionDisplayProps> = ({ 
    data, setData, onSetReminder, onShowMedicationInfo, onTranslate, isTranslating, isTranslated, onRevertTranslation 
}) => {

    const handleDataChange = (field: keyof PrescriptionData, value: string) => {
        setData(prev => prev ? { ...prev, [field]: value } : null);
    };
    
    const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
        setData(prev => {
            if (!prev) return null;
            const newMedications = [...prev.medications];
            newMedications[index] = { ...newMedications[index], [field]: value };
            return { ...prev, medications: newMedications };
        });
    };

    const addMedication = () => {
        setData(prev => prev ? { ...prev, medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }] } : null);
    };

    const removeMedication = (index: number) => {
        setData(prev => prev ? { ...prev, medications: prev.medications.filter((_, i) => i !== index) } : null);
    };

    return (
    <div className="space-y-8 bg-white/30 dark:bg-slate-900/40 p-4 sm:p-8 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Prescription Details</h2>
            <div className="flex items-center gap-2">
                {isTranslated && (
                    <button 
                        onClick={onRevertTranslation}
                        className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 py-2 px-4 rounded-full bg-slate-200/50 dark:bg-slate-700/50"
                    >
                        Show Original
                    </button>
                )}
                <div className="relative">
                    <select
                        onChange={(e) => onTranslate(e.target.value)}
                        disabled={isTranslating}
                        className="appearance-none cursor-pointer bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                        value=""
                    >
                        <option value="" disabled>Translate...</option>
                        {Object.entries(LANGUAGES).map(([name, code]) => (
                            <option key={code} value={name}>{name}</option>
                        ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isTranslating ? <ButtonSpinnerIcon className="h-5 w-5 text-slate-500" /> : <TranslateIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <EditableInfoCard icon={<UserIcon className="h-5 w-5 text-slate-500 dark:text-slate-400"/>} label="Patient Name" value={data.patientName} field="patientName" onChange={handleDataChange} />
             <EditableInfoCard icon={<DoctorIcon className="h-5 w-5 text-slate-500 dark:text-slate-400"/>} label="Doctor Name" value={data.doctorName} field="doctorName" onChange={handleDataChange} />
             <EditableInfoCard icon={<CalendarIcon className="h-5 w-5 text-slate-500 dark:text-slate-400"/>} label="Date" value={data.date} field="date" onChange={handleDataChange} />
             <EditableInfoCard icon={<DiagnosisIcon className="h-5 w-5 text-slate-500 dark:text-slate-400"/>} label="Diagnosis" value={data.diagnosis} field="diagnosis" onChange={handleDataChange} />
        </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300">Medications</h3>
            <button
                onClick={addMedication}
                className="flex items-center bg-cyan-100 hover:bg-cyan-200 text-cyan-600 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 dark:text-cyan-400 font-bold py-1.5 px-3 rounded-full transition-colors text-sm"
            >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Row
            </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Medicine Name</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Dosage</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Frequency</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Duration</th>
                <th scope="col" className="w-28 text-center text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
              {data.medications && data.medications.length > 0 ? (
                data.medications.map((med, index) => (
                  <tr key={index} className="odd:bg-white/30 even:bg-slate-50/30 dark:odd:bg-slate-800/30 dark:even:bg-slate-700/30">
                    {Object.keys(med).map((key) => (
                       <td key={key} className="px-4 py-1 whitespace-nowrap">
                           <input 
                            type="text"
                            value={med[key as keyof Medication]}
                            onChange={(e) => handleMedicationChange(index, key as keyof Medication, e.target.value)}
                            className="w-full text-sm text-gray-800 dark:text-slate-200 bg-transparent focus:outline-none p-2 rounded-md focus:bg-slate-100 dark:focus:bg-slate-600 transition-colors"
                            />
                       </td>
                    ))}
                    <td className="px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                            <button onClick={() => onShowMedicationInfo(med.name)} title={`Info about ${med.name}`} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1 rounded-full">
                               <InfoCircleIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onSetReminder(med)} title={`Set reminder for ${med.name}`} className="text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors p-1 rounded-full">
                               <BellIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => removeMedication(index)} title="Remove row" className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-full">
                               <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                    No medications found. Click 'Add Row' to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400">
          <p>
            <span className="font-semibold">Disclaimer:</span> Please ensure all information is accurate.
            Always verify with a healthcare professional.
          </p>
      </div>
    </div>
  );
};