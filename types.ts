export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionData {
  patientName: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: Medication[];
}

// New type for storing multiple named prescriptions
export interface SavedPrescription extends PrescriptionData {
  id: string; // Unique identifier (e.g., timestamp)
  name: string; // User-defined name for the prescription
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface InteractionResult {
  medications: [string, string];
  severity: 'Major' | 'Moderate' | 'Minor' | 'Unknown';
  description: string;
}

export interface Reminder {
  id: string; // e.g., `${prescriptionId}-${medicationName}`
  medicationName: string;
  prescriptionName: string; // Context for the user
  times: string[]; // e.g., ["09:00", "21:00"]
  frequency: string; // e.g., "Twice a day"
}

export interface RefillReminder {
    id: string;
    prescriptionName: string;
    refillDate: string; // ISO date string YYYY-MM-DD
}

export interface PriceResult {
  pharmacy: string;
  price: string;
  url: string;
}

export interface PriceCheckResult {
    prices: PriceResult[];
    sources: any[]; // Grounding chunks from Gemini
}

export interface MedicationInfo {
    uses: string;
    sideEffects: string;
    precautions: string;
}