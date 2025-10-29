import React from 'react';
import { UploadIcon, CameraIcon, ManualEntryIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onManualEntry: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onManualEntry }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
        e.target.value = ''; // Reset input to allow re-selecting the same file
    }
  };

  return (
    <div
      className="border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm border-gray-300 dark:border-slate-700"
    >
      <input
        type="file"
        id="camera-upload"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center">
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-full mb-5">
          <UploadIcon className="h-10 w-10 text-slate-500 dark:text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-gray-700 dark:text-slate-300">Upload or Enter a Prescription</p>
        <p className="text-gray-500 dark:text-slate-400 mt-1 mb-6">Select a file, use your camera, or enter details manually.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-sm">
            <label htmlFor="file-upload" title="Select image from files" className="cursor-pointer w-full sm:w-auto flex-1 text-center bg-white hover:bg-slate-100 text-cyan-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-cyan-400 font-semibold py-3 px-4 border border-slate-300 dark:border-slate-500 rounded-full shadow-sm transition-all transform hover:scale-105 flex items-center justify-center">
              Browse Files
            </label>
            <label
                htmlFor="camera-upload"
                title="Capture image with camera"
                className="cursor-pointer w-full sm:w-auto flex-1 text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 border border-transparent rounded-full shadow-sm transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <CameraIcon className="h-5 w-5"/>
              Use Camera
            </label>
        </div>
        
        <div className="relative flex py-5 items-center w-full max-w-sm">
            <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 dark:text-slate-500 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
        </div>

        <button
            onClick={onManualEntry}
            className="w-full max-w-sm text-center bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-full shadow-sm transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
            <ManualEntryIcon className="h-5 w-5"/>
            Enter Details Manually
        </button>


        <p className="text-xs text-gray-400 dark:text-slate-500 mt-6">Supports: JPG, PNG, WEBP</p>
      </div>
    </div>
  );
};