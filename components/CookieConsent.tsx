import React from 'react';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800/80 dark:bg-slate-950/80 backdrop-blur-lg p-4 z-50 border-t border-slate-700">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-300 dark:text-slate-300 text-center sm:text-left">
          We use your browser's local storage to save your scanned prescription data on your device for your convenience. This data is not sent to our servers. Do you accept?
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onDecline}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors px-4 py-1.5 rounded-full"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-1.5 px-5 rounded-full text-sm transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};