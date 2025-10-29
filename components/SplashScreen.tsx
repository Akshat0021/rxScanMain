import React from 'react';
import { LogoIcon } from './icons';

export const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 gradient-bg z-50">
    <div className="flex items-center gap-4 mb-4">
      <LogoIcon className="h-16 w-16 text-cyan-500 animate-pulse" />
      <h1 className="text-5xl font-bold tracking-tight">
        <span className="text-cyan-500">Rx</span>
        <span className="text-slate-100">Scan</span>
      </h1>
    </div>
    <p className="text-slate-400">Loading your intelligent prescription assistant...</p>
  </div>
);