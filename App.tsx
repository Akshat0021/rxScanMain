
import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { PrescriptionDisplay } from './components/PrescriptionDisplay';
import AIChat from './components/Chat';
import { InteractionChecker } from './components/InteractionChecker';
import { PrescriptionsList } from './components/PrescriptionsList';
import { SavePresetModal } from './components/SavePresetModal';
import { Reminders } from './components/Reminders';
import { scanPrescription, verifyMedicationName, translatePrescription, getMedicationInfo } from './services/geminiService';
import { generatePrescriptionPDF } from './utils/pdfGenerator';
import type { PrescriptionData, SavedPrescription, Medication, Reminder, RefillReminder, MedicationInfo } from './types';
import { ResetIcon, LogoIcon, ButtonSpinnerIcon, PDFExportIcon, SaveIcon, FolderIcon } from './components/icons';
import { Spinner } from './components/Spinner';
import { SplashScreen } from './components/SplashScreen';
import { CookieConsent } from './components/CookieConsent';
import { saveOrUpdatePrescription, loadAllPrescriptions, deletePrescriptionById, clearPrescriptionCookie } from './utils/cookieManager';
import { loadReminders, saveReminders, loadRefillReminders, saveRefillReminders } from './utils/reminderManager';
import { Notification } from './components/Notification';
import { parseFrequency, parseDuration } from './utils/reminderHelpers';
import PriceComparison from './components/PriceComparison';
import { MedicationInfoModal } from './components/MedicationInfoModal';

type Tab = 'scanner' | 'chat' | 'interactions' | 'reminders' | 'prices';
type CookieStatus = 'pending' | 'accepted' | 'declined';
type NotificationState = {
  message: string;
  type: 'success' | 'warning' | 'info';
} | null;

const BLANK_PRESCRIPTION: PrescriptionData = {
  patientName: '',
  doctorName: '',
  date: '',
  diagnosis: '',
  medications: [],
};

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [cookieConsentStatus, setCookieConsentStatus] = useState<CookieStatus>('pending');
  const [activeTab, setActiveTab] = useState<Tab>('scanner');
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<PrescriptionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Analyzing Prescription...');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>(null);

  const [isPrescriptionListOpen, setIsPrescriptionListOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [allPrescriptions, setAllPrescriptions] = useState<SavedPrescription[]>([]);

  // State for reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refillReminders, setRefillReminders] = useState<RefillReminder[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // State for translation
  const [originalPrescription, setOriginalPrescription] = useState<PrescriptionData | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // State for Medication Info Modal
  const [isMedInfoModalOpen, setIsMedInfoModalOpen] = useState<boolean>(false);
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [medicationInfo, setMedicationInfo] = useState<MedicationInfo | null>(null);
  const [isMedInfoLoading, setIsMedInfoLoading] = useState<boolean>(false);


  useEffect(() => {
    // Splash screen
    const timer = setTimeout(() => setIsAppLoading(false), 2000);

    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'accepted') {
      setCookieConsentStatus('accepted');
      setAllPrescriptions(loadAllPrescriptions());
      setReminders(loadReminders());
      setRefillReminders(loadRefillReminders());
    } else if (consent === 'declined') {
      setCookieConsentStatus('declined');
    }

    if ('Notification' in window) {
      // FIX: Use window.Notification to avoid conflict with the Notification component.
      setNotificationPermission(window.Notification.permission);
    }

    return () => clearTimeout(timer);
  }, []);

  // Reminder checking interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (notificationPermission === 'granted') {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        reminders.forEach(reminder => {
          if (reminder.times.includes(currentTime)) {
            // FIX: Use window.Notification to avoid conflict with the Notification component.
            new window.Notification(`Time for your medication: ${reminder.medicationName}`, {
              body: `From prescription: ${reminder.prescriptionName}. Don't forget!`,
              icon: '/logo.svg' // You would host a logo for notifications
            });
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [reminders, notificationPermission]);

  const showNotification = (message: string, type: 'success' | 'warning' | 'info') => {
    setNotification({ message, type });
  };

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      handleReset(true);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      showNotification('Please select a valid image file.', 'warning');
    }
  }, []);

  const handleManualEntry = () => {
    handleReset(true);
    setEditableData(BLANK_PRESCRIPTION);
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing Prescription...');
    setError(null);
    setEditableData(null);
    setCurrentPrescriptionId(null);

    try {
      const initialData = await scanPrescription(selectedFile);
      setLoadingMessage('Verifying medications online...');
      if (initialData.medications && initialData.medications.length > 0) {
        const verifiedMedications = await Promise.all(
          initialData.medications.map(async (med) => ({ ...med, name: await verifyMedicationName(med.name) }))
        );
        setEditableData({ ...initialData, medications: verifiedMedications });
      } else {
        setEditableData(initialData);
      }
    } catch (err) {
      console.error(err);
      setError('The AI could not read the prescription. Please try a clearer image.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = (isNew: boolean) => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setEditableData(null);
    setIsLoading(false);
    setError(null);
    setCurrentPrescriptionId(null);
    setOriginalPrescription(null);
    setIsTranslating(false);
    setActiveTab('scanner');
  };
  
  const handleExport = () => editableData && generatePrescriptionPDF(editableData);

  const handleSave = () => {
    if (!editableData) return;
    if (cookieConsentStatus !== 'accepted') {
      showNotification('Please accept the storage policy to save your data.', 'warning');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = (name: string) => {
    if (!editableData) return;
    const prescriptionToSave: SavedPrescription = {
        id: currentPrescriptionId || Date.now().toString(),
        name,
        ...(originalPrescription || editableData) // Save original if translated
    };
    saveOrUpdatePrescription(prescriptionToSave);
    setAllPrescriptions(loadAllPrescriptions());
    setCurrentPrescriptionId(prescriptionToSave.id);
    setIsSaveModalOpen(false);
    showNotification(`Prescription "${name}" saved!`, 'success');
    handleSetRefillReminder(prescriptionToSave);
  };

  const handleLoadPrescription = (id: string) => {
    const prescription = allPrescriptions.find(p => p.id === id);
    if (prescription) {
        handleReset(false);
        const { id: loadedId, name, ...data } = prescription;
        setEditableData(data);
        setCurrentPrescriptionId(loadedId);
        setIsPrescriptionListOpen(false);
        showNotification(`Loaded "${name}".`, 'info');
    }
  };

  const handleDeletePrescription = (id: string) => {
    deletePrescriptionById(id);
    const updatedList = loadAllPrescriptions();
    setAllPrescriptions(updatedList);
    showNotification('Prescription deleted.', 'success');
    if (currentPrescriptionId === id) {
        handleReset(false);
    }
    if(updatedList.length === 0) {
        setIsPrescriptionListOpen(false);
    }
  };

  const handleRenamePrescription = (id: string, newName: string) => {
    const prescription = allPrescriptions.find(p => p.id === id);
    if (prescription) {
        const updatedPrescription = { ...prescription, name: newName };
        saveOrUpdatePrescription(updatedPrescription);
        setAllPrescriptions(loadAllPrescriptions());
        showNotification('Prescription renamed!', 'success');
    }
  };

  const handleCookieConsent = (accepted: boolean) => {
    localStorage.setItem('cookieConsent', accepted ? 'accepted' : 'declined');
    setCookieConsentStatus(accepted ? 'accepted' : 'declined');
    if (accepted) {
      setAllPrescriptions(loadAllPrescriptions());
      setReminders(loadReminders());
      setRefillReminders(loadRefillReminders());
      showNotification('Storage preferences saved.', 'success');
    } else {
      clearPrescriptionCookie();
      setAllPrescriptions([]);
      showNotification('Storage permission declined. Your data will not be saved.', 'info');
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showNotification('This browser does not support desktop notifications.', 'warning');
      return;
    }
    // FIX: Use window.Notification to avoid conflict with the Notification component.
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      showNotification('Notification permissions granted!', 'success');
    } else {
      showNotification('Notification permissions denied.', 'warning');
    }
  };

  const handleSetReminder = (medication: Medication) => {
    if (notificationPermission === 'denied') {
      showNotification('Please enable notification permissions in your browser settings.', 'warning');
      return;
    }
    if (notificationPermission === 'default') {
      handleRequestNotificationPermission();
    }
    if (!currentPrescriptionId) {
        showNotification('Please save the prescription before setting reminders.', 'warning');
        return;
    }

    const prescriptionName = allPrescriptions.find(p => p.id === currentPrescriptionId)?.name || 'Untitled';
    const existingReminder = reminders.find(r => r.id === `${currentPrescriptionId}-${medication.name}`);
    if (existingReminder) {
        showNotification(`Reminder already exists for ${medication.name}.`, 'info');
        return;
    }

    const times = parseFrequency(medication.frequency);
    if (times.length === 0) {
        showNotification(`Could not determine a schedule for "${medication.frequency}".`, 'warning');
        return;
    }
    
    const newReminder: Reminder = {
      id: `${currentPrescriptionId}-${medication.name}`,
      medicationName: medication.name,
      prescriptionName,
      times,
      frequency: medication.frequency,
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
    showNotification(`Reminder set for ${medication.name}.`, 'success');
  };

  const handleSetRefillReminder = (prescription: SavedPrescription) => {
      const refillDate = parseDuration(prescription.date, prescription.medications);
      if (!refillDate) return;

      const existing = refillReminders.find(r => r.id === prescription.id);
      if (existing) return; // Already exists

      const newRefill: RefillReminder = {
          id: prescription.id,
          prescriptionName: prescription.name,
          refillDate: refillDate.toISOString().split('T')[0],
      };

      const updatedRefills = [...refillReminders, newRefill];
      setRefillReminders(updatedRefills);
      saveRefillReminders(updatedRefills);
      showNotification(`Refill reminder scheduled for ${prescription.name}.`, 'success');
  }

  const handleDeleteReminder = (id: string) => {
      const updated = reminders.filter(r => r.id !== id);
      setReminders(updated);
      saveReminders(updated);
      showNotification('Reminder removed.', 'success');
  };

  const handleDeleteRefillReminder = (id: string) => {
      const updated = refillReminders.filter(r => r.id !== id);
      setRefillReminders(updated);
      saveRefillReminders(updated);
      showNotification('Refill reminder removed.', 'success');
  }

  const handleTranslate = async (language: string) => {
      if (!editableData) return;
      setIsTranslating(true);
      setOriginalPrescription(editableData);
      try {
          const translatedData = await translatePrescription(editableData, language);
          setEditableData(translatedData);
          showNotification(`Prescription translated to ${language}.`, 'success');
      } catch (error) {
          console.error("Translation failed", error);
          showNotification('Failed to translate the prescription.', 'warning');
          setOriginalPrescription(null); // Clear backup on failure
      } finally {
          setIsTranslating(false);
      }
  };

  const handleRevertTranslation = () => {
      if (originalPrescription) {
          setEditableData(originalPrescription);
          setOriginalPrescription(null);
          showNotification('Reverted to original language.', 'info');
      }
  };

  const handleShowMedicationInfo = async (medicationName: string) => {
    setSelectedMedication(medicationName);
    setIsMedInfoModalOpen(true);
    setIsMedInfoLoading(true);
    try {
        const info = await getMedicationInfo(medicationName);
        setMedicationInfo(info);
    } catch (error) {
        console.error("Failed to get medication info:", error);
        setMedicationInfo({
            uses: 'Could not load information.',
            sideEffects: 'Please check your connection and try again.',
            precautions: '',
        });
    } finally {
        setIsMedInfoLoading(false);
    }
  };

  const handleCloseMedicationInfo = () => {
    setIsMedInfoModalOpen(false);
    // Delay clearing data to allow for closing animation
    setTimeout(() => {
        setSelectedMedication(null);
        setMedicationInfo(null);
    }, 300);
  };


  const renderScanner = () => (
    <>
      {!selectedFile && !editableData && <FileUpload onFileSelect={handleFileSelect} onManualEntry={handleManualEntry} />}
      {previewUrl && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-slate-300 text-center">Prescription Preview</h2>
          <div className="w-full border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-2 bg-gray-50/60 dark:bg-slate-900/40 backdrop-blur-lg">
            <img src={previewUrl} alt="Prescription preview" className="max-h-[50vh] w-auto mx-auto rounded-md" />
          </div>
        </div>
      )}

      {error && (
        <div role="alert" aria-live="polite" className="my-4 p-6 bg-red-100/80 border-2 border-dashed border-red-400 text-red-700 rounded-2xl text-center dark:bg-red-900/40 dark:border-red-500/30 dark:text-red-400 backdrop-blur-lg flex flex-col items-center gap-4">
          <div>
            <p className="font-bold text-lg">Scan Failed</p>
            <p className="mt-1">{error}</p>
          </div>
          <button
            onClick={handleScan}
            disabled={isLoading}
            className="flex items-center justify-center w-48 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-full transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 shadow-lg shadow-red-500/30 disabled:bg-red-400 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? <><ButtonSpinnerIcon className="h-5 w-5 mr-2" />Retrying...</> : <><ResetIcon className="h-5 w-5 mr-2" />Retry Scan</>}
          </button>
        </div>
      )}

      {selectedFile && !editableData && !error && (
         <>
            {isLoading ? <Spinner message={loadingMessage} /> : (
                <div className="text-center mt-6">
                <button
                    onClick={handleScan}
                    disabled={isLoading}
                    className="flex items-center justify-center w-56 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800 shadow-lg shadow-cyan-500/20 disabled:bg-cyan-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Scan Prescription
                </button>
                </div>
            )}
        </>
      )}
      
      {editableData && (
         <>
          <PrescriptionDisplay 
            data={editableData} 
            setData={setEditableData} 
            onSetReminder={handleSetReminder}
            onShowMedicationInfo={handleShowMedicationInfo}
            isTranslating={isTranslating}
            isTranslated={!!originalPrescription}
            onTranslate={handleTranslate}
            onRevertTranslation={handleRevertTranslation}
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
                onClick={() => handleReset(true)}
                className="flex items-center justify-center w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 dark:focus:ring-slate-700"
            >
                <ResetIcon className="h-5 w-5 mr-2" />
                Start Over
            </button>
            <button
                onClick={handleSave}
                disabled={cookieConsentStatus !== 'accepted'}
                title={cookieConsentStatus !== 'accepted' ? 'Accept storage policy to save' : 'Save prescription'}
                aria-label="Save prescription"
                className="flex items-center justify-center w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 disabled:bg-gray-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
                <SaveIcon className="h-5 w-5 mr-2" />
                {currentPrescriptionId ? 'Update' : 'Save'}
            </button>
            <button
                onClick={handleExport}
                className="flex items-center justify-center w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-6 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
            >
                <PDFExportIcon className="h-5 w-5 mr-2" />
                Export to PDF
            </button>
           </div>
        </>
      )}
    </>
  );

  if (isAppLoading) {
    return <SplashScreen />;
  }

  const showInteractionTab = editableData && editableData.medications.length >= 2;
  const showPricesTab = editableData && editableData.medications.length > 0;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 dark:text-slate-200 transition-colors duration-300">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => { handleReset(false); }} className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg" aria-label="Go to home screen">
               <LogoIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-500" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                <span className="text-cyan-600 dark:text-cyan-500">Rx</span>
                <span className="text-gray-800 dark:text-slate-100">Scan</span>
              </h1>
            </button>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsPrescriptionListOpen(true)}
                    disabled={cookieConsentStatus !== 'accepted'}
                    title={cookieConsentStatus !== 'accepted' ? 'Accept storage policy to view saved data' : 'My Prescriptions'}
                    aria-label="View saved prescriptions"
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <FolderIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </button>
                <nav className="hidden md:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                    <button onClick={() => setActiveTab('scanner')} className={`relative py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${activeTab === 'scanner' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>Scanner</button>
                    <button onClick={() => setActiveTab('reminders')} className={`relative py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${activeTab === 'reminders' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>Reminders</button>
                    <button onClick={() => setActiveTab('chat')} className={`relative py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>AI Chat</button>
                    {showInteractionTab && <button onClick={() => setActiveTab('interactions')} className={`relative py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${activeTab === 'interactions' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>Interactions</button>}
                    {showPricesTab && <button onClick={() => setActiveTab('prices')} className={`relative py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${activeTab === 'prices' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>Prices</button>}
                </nav>
            </div>
          </div>
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800">
            <nav className="flex justify-around py-1">
                 <button onClick={() => setActiveTab('scanner')} className={`flex-1 py-2 text-center text-sm font-semibold transition-colors ${activeTab === 'scanner' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>Scanner</button>
                 <button onClick={() => setActiveTab('reminders')} className={`flex-1 py-2 text-center text-sm font-semibold transition-colors ${activeTab === 'reminders' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>Reminders</button>
                 <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 text-center text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>AI Chat</button>
                 {showInteractionTab && <button onClick={() => setActiveTab('interactions')} className={`flex-1 py-2 text-center text-sm font-semibold transition-colors ${activeTab === 'interactions' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>Interactions</button>}
                 {showPricesTab && <button onClick={() => setActiveTab('prices')} className={`flex-1 py-2 text-center text-sm font-semibold transition-colors ${activeTab === 'prices' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>Prices</button>}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl transition-opacity duration-300">
          {activeTab === 'scanner' && renderScanner()}
          {activeTab === 'chat' && <AIChat prescriptionData={editableData} storageConsent={cookieConsentStatus} />}
          {activeTab === 'interactions' && <InteractionChecker medications={editableData?.medications || []} />}
          {activeTab === 'reminders' && (
            <Reminders 
              reminders={reminders}
              refillReminders={refillReminders}
              onDeleteReminder={handleDeleteReminder}
              onDeleteRefillReminder={handleDeleteRefillReminder}
              notificationPermission={notificationPermission}
              onRequestPermission={handleRequestNotificationPermission}
              storageConsent={cookieConsentStatus}
            />
          )}
          {activeTab === 'prices' && <PriceComparison medicationName={editableData?.medications[0]?.name || null} />}
        </div>
      </main>

      {cookieConsentStatus === 'pending' && <CookieConsent onAccept={() => handleCookieConsent(true)} onDecline={() => handleCookieConsent(false)} />}
      
      {isPrescriptionListOpen && (
        <PrescriptionsList
            prescriptions={allPrescriptions}
            onClose={() => setIsPrescriptionListOpen(false)}
            onLoad={handleLoadPrescription}
            onDelete={handleDeletePrescription}
            onRename={handleRenamePrescription}
        />
      )}

      {isSaveModalOpen && (
        <SavePresetModal
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleConfirmSave}
            currentName={allPrescriptions.find(p => p.id === currentPrescriptionId)?.name || ''}
            isUpdate={!!currentPrescriptionId}
        />
      )}

      {isMedInfoModalOpen && (
        <MedicationInfoModal
            medicationName={selectedMedication}
            medicationInfo={medicationInfo}
            isLoading={isMedInfoLoading}
            onClose={handleCloseMedicationInfo}
        />
      )}
    </div>
  );
};

export default App;
