import React from 'react';
import type { SavedPrescription } from '../types';
import { CloseIcon, FolderIcon, TrashIcon, EditIcon } from './icons';

interface PrescriptionsListProps {
  prescriptions: SavedPrescription[];
  onClose: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export const PrescriptionsList: React.FC<PrescriptionsListProps> = ({ prescriptions, onClose, onLoad, onDelete, onRename }) => {

  const handleRename = (id: string, currentName: string) => {
    const newName = prompt("Enter a new name for the prescription:", currentName);
    if (newName && newName.trim() !== "" && newName !== currentName) {
      onRename(id, newName.trim());
    }
  };

  const handleDelete = (id: string, name: string) => {
      if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
          onDelete(id);
      }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      aria-labelledby="prescription-list-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 m-4 flex flex-col max-h-[80vh] animate-fade-in-down">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 id="prescription-list-title" className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <FolderIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              My Prescriptions
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-2 sm:p-4">
          {prescriptions.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {prescriptions.map((p) => (
                <li key={p.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800 dark:text-slate-100">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Patient: {p.patientName || 'N/A'} &bull; Date: {p.date || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <button
                        onClick={() => handleRename(p.id, p.name)}
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Rename"
                    >
                        <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onLoad(p.id)}
                      className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-full transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-8">
              <FolderIcon className="h-16 w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">No Saved Prescriptions</h3>
              <p className="text-gray-600 dark:text-slate-400 mt-2">
                Scan and save a prescription to see it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};