import React, { useState, useEffect } from 'react';
import { CloseIcon, SaveIcon } from './icons';

interface SavePresetModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
  currentName?: string;
  isUpdate: boolean;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({ onClose, onSave, currentName = '', isUpdate }) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    // Auto-focus the input field when the modal opens
    const inputElement = document.getElementById('prescriptionNameInput');
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      aria-labelledby="save-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 m-4 animate-fade-in-down">
        <div className="flex justify-between items-center mb-4">
          <h2 id="save-modal-title" className="text-xl font-bold text-gray-800 dark:text-slate-100">
            {isUpdate ? 'Update Prescription' : 'Save Prescription'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
            Give this prescription a name so you can easily find it later.
          </p>
          <input
            id="prescriptionNameInput"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John's Monthly Meds"
            className="w-full p-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition"
            required
          />

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center justify-center w-32 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 disabled:bg-gray-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              <SaveIcon className="h-5 w-5 mr-2" />
              {isUpdate ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};