import React from 'react';
import type { Reminder, RefillReminder } from '../types';
import { BellIcon, CalendarIcon, TrashIcon } from './icons';

interface RemindersProps {
  reminders: Reminder[];
  refillReminders: RefillReminder[];
  onDeleteReminder: (id: string) => void;
  onDeleteRefillReminder: (id: string) => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
  storageConsent: 'pending' | 'accepted' | 'declined';
}

export const Reminders: React.FC<RemindersProps> = ({ 
    reminders, refillReminders, onDeleteReminder, onDeleteRefillReminder, notificationPermission, onRequestPermission, storageConsent 
}) => {

    if (storageConsent !== 'accepted') {
        return (
            <div className="text-center p-8 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <BellIcon className="h-16 w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Reminders</h2>
                <p className="text-gray-600 dark:text-slate-400 mt-2">
                  Please accept the storage policy on the Scanner tab to use the reminders feature.
                </p>
            </div>
        );
    }
    
  return (
    <div className="animate-fade-in-down space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-slate-200 mb-6">
          My Reminders
        </h2>
        
        {notificationPermission !== 'granted' && (
            <div className="mb-8 p-4 bg-yellow-100/80 dark:bg-yellow-900/60 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-r-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <p className="font-bold">Enable Notifications</p>
                    <p className="text-sm">To receive alerts, you need to allow browser notifications.</p>
                </div>
                {notificationPermission === 'default' && (
                    <button 
                        onClick={onRequestPermission}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-5 rounded-full text-sm transition-colors flex-shrink-0"
                    >
                        Enable
                    </button>
                )}
                 {notificationPermission === 'denied' && (
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">Permission was denied. Please enable it in your browser settings.</p>
                )}
            </div>
        )}
      </div>

      {/* Medication Reminders */}
      <div className="p-4 sm:p-6 bg-white/30 dark:bg-slate-900/40 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl">
         <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-cyan-500"/>
            Medication Schedules
         </h3>
         {reminders.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {reminders.map(r => (
                    <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-slate-100">{r.medicationName}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">From: {r.prescriptionName}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {r.times.map(time => (
                                    <span key={time} className="text-xs font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">{time}</span>
                                ))}
                            </div>
                        </div>
                        <button 
                            onClick={() => onDeleteReminder(r.id)}
                            title="Delete reminder"
                            className="p-2 rounded-full text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex-shrink-0"
                        >
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                    </li>
                ))}
            </ul>
         ) : (
            <p className="text-sm text-center text-gray-500 dark:text-slate-400 py-6">
                No medication reminders set.
                <br />
                Save a prescription and click the bell icon next to a medicine to add one.
            </p>
         )}
      </div>

       {/* Refill Reminders */}
       <div className="p-4 sm:p-6 bg-white/30 dark:bg-slate-900/40 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl">
         <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-green-500"/>
            Upcoming Refills
         </h3>
         {refillReminders.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {refillReminders.sort((a,b) => new Date(a.refillDate).getTime() - new Date(b.refillDate).getTime()).map(r => (
                    <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-slate-100">{r.prescriptionName}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Refill needed on or before: <span className="font-semibold text-gray-700 dark:text-slate-200">{new Date(r.refillDate).toLocaleDateString()}</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => onDeleteRefillReminder(r.id)}
                            title="Delete refill reminder"
                            className="p-2 rounded-full text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex-shrink-0"
                        >
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                    </li>
                ))}
            </ul>
         ) : (
            <p className="text-sm text-center text-gray-500 dark:text-slate-400 py-6">
                No refill reminders found.
                <br />
                Save a prescription with a duration to automatically schedule one.
            </p>
         )}
      </div>

    </div>
  );
};