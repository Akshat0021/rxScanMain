import type { Medication } from '../types';

/**
 * Parses a frequency string into an array of HH:MM times.
 * This is a simplified implementation and can be expanded.
 */
export const parseFrequency = (frequency: string): string[] => {
    const lowerFreq = frequency.toLowerCase();
    
    if (lowerFreq.includes('1-0-0') || lowerFreq.includes('once a day') || lowerFreq.includes('morning')) {
        return ['09:00'];
    }
    if (lowerFreq.includes('0-0-1') || lowerFreq.includes('night')) {
        return ['21:00'];
    }
    if (lowerFreq.includes('1-0-1') || lowerFreq.includes('twice a day') || lowerFreq.includes('bd') || lowerFreq.includes('bid')) {
        return ['09:00', '21:00'];
    }
    if (lowerFreq.includes('1-1-1') || lowerFreq.includes('thrice a day') || lowerFreq.includes('tds') || lowerFreq.includes('tid')) {
        return ['09:00', '13:00', '21:00'];
    }
    if (lowerFreq.includes('four times a day') || lowerFreq.includes('qid')) {
        return ['08:00', '12:00', '16:00', '21:00'];
    }
    
    // Add more complex parsing logic as needed
    return [];
};

/**
 * Parses the duration from a list of medications and calculates a refill date.
 * It finds the longest duration among all medications to set a single refill date for the prescription.
 */
export const parseDuration = (prescriptionDate: string, medications: Medication[]): Date | null => {
    if (!medications || medications.length === 0) return null;

    let maxDurationDays = 0;

    medications.forEach(med => {
        const duration = med.duration.toLowerCase();
        const match = duration.match(/(\d+)\s*(day|week|month)s?/);
        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2];
            let days = 0;
            if (unit === 'day') days = value;
            if (unit === 'week') days = value * 7;
            if (unit === 'month') days = value * 30; // Approximation
            
            if (days > maxDurationDays) {
                maxDurationDays = days;
            }
        }
    });

    if (maxDurationDays === 0) return null;

    // Use a flexible date parser for prescriptionDate, as its format can vary
    const startDate = new Date(prescriptionDate);
    // If the date is invalid, try to parse it as DD/MM/YYYY or MM/DD/YYYY
    if (isNaN(startDate.getTime())) {
        const parts = prescriptionDate.split(/[\/\-.]/);
        if (parts.length === 3) {
            // Attempt DD/MM/YYYY
            const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(d.getTime())) {
                startDate.setTime(d.getTime());
            }
        }
    }

    if (isNaN(startDate.getTime())) return null; // Still invalid, give up

    // Set refill reminder one day before the course ends
    const refillDate = new Date(startDate);
    refillDate.setDate(refillDate.getDate() + maxDurationDays - 1);
    
    return refillDate;
};