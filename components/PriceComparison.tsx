import React, { useState, useEffect } from 'react';
import { getMedicationPrices } from '../services/geminiService';
import type { PriceResult } from '../types';
import { PriceTagIcon } from './icons';

interface PriceComparisonProps {
  medicationName: string | null;
}

const PriceComparison: React.FC<PriceComparisonProps> = ({ medicationName }) => {
  const [results, setResults] = useState<PriceResult[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (medicationName) {
      const fetchPrices = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
        setSources([]);
        try {
          const { prices, sources: priceSources } = await getMedicationPrices(medicationName);
          if (prices.length === 0) {
              setError("No prices found for this medication. It may be unavailable or the name is not specific enough.");
          }
          setResults(prices);
          setSources(priceSources);
        } catch (err) {
          console.error(err);
          setError("An error occurred while fetching prices. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPrices();
    }
  }, [medicationName]);

  if (!medicationName) {
    return (
      <div className="text-center p-8 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <PriceTagIcon className="h-16 w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Compare Medication Prices</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-2">
          Scan a prescription with medications to enable price comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-down">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-slate-200 mb-6">
        Price Results for <span className="text-cyan-600 dark:text-cyan-400">{medicationName}</span>
      </h2>

      {isLoading && (
        <div className="flex flex-col items-center justify-center my-8">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-300 font-semibold">Searching for the best prices...</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Please wait a moment.</p>
        </div>
      )}
      
      {error && (
        <div role="alert" className="my-4 p-6 bg-red-100/80 border-2 border-dashed border-red-400 text-red-700 rounded-2xl text-center dark:bg-red-900/40 dark:border-red-500/30 dark:text-red-400 backdrop-blur-lg">
          <p className="font-bold text-lg">Could Not Fetch Prices</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
                <div key={index} className="p-6 bg-white/60 dark:bg-slate-800/50 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 backdrop-blur-sm flex flex-col justify-between hover:shadow-xl hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{result.pharmacy}</h3>
                        <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 my-3">{result.price}</p>
                    </div>
                    <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 px-4 border border-transparent rounded-full shadow-sm transition-all transform hover:scale-105"
                    >
                        Visit Store
                    </a>
                </div>
            ))}
        </div>
        {sources.length > 0 && (
             <div className="mt-8 p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-2">Sources</h4>
                <ul className="space-y-1">
                    {sources.filter(s => s.web).map((source, index) => (
                        <li key={index} className="text-xs text-gray-500 dark:text-slate-500 truncate">
                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                {source.web.title || source.web.uri}
                            </a>
                        </li>
                    ))}
                </ul>
             </div>
         )}
        </>
      )}
    </div>
  );
};

export default PriceComparison;
