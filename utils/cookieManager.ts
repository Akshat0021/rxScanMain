import type { SavedPrescription, ChatMessage } from '../types';

const STORAGE_KEY = 'rxscanner_prescriptions_list'; // Updated key for the list
const CHAT_HISTORY_KEY = 'rxscanner_chat_history';

// --- Multiple Prescription Management ---

export const loadAllPrescriptions = (): SavedPrescription[] => {
  try {
    const dataString = localStorage.getItem(STORAGE_KEY);
    if (!dataString) {
      return [];
    }
    return JSON.parse(dataString) as SavedPrescription[];
  } catch (error) {
    console.error("Failed to load prescriptions from local storage:", error);
    localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
    return [];
  }
};

export const saveOrUpdatePrescription = (prescriptionToSave: SavedPrescription): void => {
  try {
    const allPrescriptions = loadAllPrescriptions();
    const existingIndex = allPrescriptions.findIndex(p => p.id === prescriptionToSave.id);

    if (existingIndex !== -1) {
      // Update existing
      allPrescriptions[existingIndex] = prescriptionToSave;
    } else {
      // Add new
      allPrescriptions.push(prescriptionToSave);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPrescriptions));
  } catch (error) {
    console.error("Failed to save prescription to local storage:", error);
  }
};

export const deletePrescriptionById = (prescriptionId: string): void => {
    try {
        let allPrescriptions = loadAllPrescriptions();
        allPrescriptions = allPrescriptions.filter(p => p.id !== prescriptionId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allPrescriptions));
    } catch (error) {
        console.error("Failed to delete prescription from local storage:", error);
    }
};

// --- Chat History Management ---

export const saveChatHistory = (messages: ChatMessage[]): void => {
  try {
    const dataString = JSON.stringify(messages);
    localStorage.setItem(CHAT_HISTORY_KEY, dataString);
  } catch (error) {
    console.error("Failed to save chat history to local storage:", error);
  }
};

export const loadChatHistory = (): ChatMessage[] | null => {
  try {
    const dataString = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!dataString) {
      return null;
    }
    return JSON.parse(dataString) as ChatMessage[];
  } catch (error) {
    console.error("Failed to load chat history from local storage:", error);
    clearChatHistory();
    return null;
  }
};

export const clearChatHistory = (): void => {
  localStorage.removeItem(CHAT_HISTORY_KEY);
};

// Legacy function, now clears the entire list for a full reset if ever needed.
export const clearPrescriptionCookie = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};