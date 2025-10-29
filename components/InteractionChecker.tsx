import React, { useState, useEffect } from 'react';
import { checkDrugInteractions } from '../services/geminiService';
import type { Medication, InteractionResult } from '../types';
import { InteractionIcon } from './icons';

interface InteractionCheckerProps {
  medications: Medication[];
}

const severityStyles = {
    Major: {
        bg: 'bg-red-100/80 dark:bg-red-900/40',
        border: 'border-red-400 dark:border-red-600',
        text: 'text-red-800 dark:text-red-300',
        badge: 'bg-red-600 text-white',
    },
    Moderate: {
        bg: 'bg-yellow-100/80 dark:bg-yellow-900/40',
        border: 'border-yellow-400 dark:border-yellow-600',
        text: 'text-yellow-800 dark:text-yellow-300',
        badge: 'bg-yellow-500 text-white',
    },
    Minor: {
        bg: 'bg-blue-100/80 dark:bg-blue-900/40',
        border: 'border-blue-400 dark:border-blue-600',
        text: 'text-blue-800 dark:text-blue-300',
        badge: 'bg-blue-500 text-white',
    },
    Unknown: {
        bg: 'bg-slate-100/80 dark:bg-slate-700/40',
        border: 'border-slate-400 dark:border-slate-500',
        text: 'text-slate-800 dark:text-slate-300',
        badge: 'bg-slate-500 text-white',
    }
};

export const InteractionChecker: React.FC<InteractionCheckerProps> = ({ medications }) => {
  const [results, setResults] = useState<InteractionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const medicationNames = medications
    .map(m => m.name)
    .filter(name => name && name.trim().toLowerCase() !== 'n/a');

  useEffect(() => {
    if (medicationNames.length >= 2) {
      const fetchInteractions = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
        try {
          const interactionData = await checkDrugInteractions(medicationNames);
          setResults(interactionData);
        } catch (err) {
          console.error(err);
          setError("An error occurred while checking for interactions. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchInteractions();
    }
  }, [medications]); // Re-run when the base medication list changes.

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center my-8">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-300 font-semibold">Analyzing Interactions...</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Please wait a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div role="alert" className="my-4 p-6 bg-red-100/80 border-2 border-dashed border-red-400 text-red-700 rounded-2xl text-center dark:bg-red-900/40 dark:border-red-500/30 dark:text-red-400 backdrop-blur-lg">
          <p className="font-bold text-lg">Analysis Failed</p>
          <p className="mt-1">{error}</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="text-center p-8 bg-green-100/80 dark:bg-green-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-2 border-dashed border-green-400 dark:border-green-600">
          <InteractionIcon className="h-16 w-16 mx-auto text-green-500 dark:text-green-400 mb-4" />
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">No Major Interactions Found</h3>
          <p className="text-green-700 dark:text-green-300 mt-2">
            The AI did not find any significant interactions between the provided medications.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {results.map((result, index) => {
          const style = severityStyles[result.severity] || severityStyles.Unknown;
          return (
            <div key={index} className={`p-6 rounded-2xl shadow-md border ${style.bg} ${style.border} backdrop-blur-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                    {result.medications.join(' + ')}
                 </h3>
                 <span className={`px-3 py-1 text-sm font-bold rounded-full ${style.badge}`}>
                    {result.severity} Interaction
                 </span>
              </div>
              <p className={`text-sm ${style.text}`}>
                {result.description}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-fade-in-down">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-slate-200 mb-4">
        Drug Interaction Check
      </h2>
      <div className="mb-8 p-4 bg-yellow-100/80 dark:bg-yellow-900/60 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-r-lg">
        <p className="font-bold">Important Disclaimer</p>
        <p className="text-sm">This information is generated by an AI and is for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding any medical concerns or before making any decisions related to your health or treatment.</p>
      </div>

      {renderContent()}
    </div>
  );
};