import type { Reminder, RefillReminder } from '../types';

const REMINDER_KEY = 'rxscanner_reminders';
const REFILL_REMINDER_KEY = 'rxscanner_refill_reminders';

// Medication Reminders
export const loadReminders = (): Reminder[] => {
    try {
        const data = localStorage.getItem(REMINDER_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load reminders", e);
        return [];
    }
};

export const saveReminders = (reminders: Reminder[]): void => {
    try {
        localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
    } catch (e) {
        console.error("Failed to save reminders", e);
    }
};

// Refill Reminders
export const loadRefillReminders = (): RefillReminder[] => {
    try {
        const data = localStorage.getItem(REFILL_REMINDER_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load refill reminders", e);
        return [];
    }
};

export const saveRefillReminders = (reminders: RefillReminder[]): void => {
    try {
        localStorage.setItem(REFILL_REMINDER_KEY, JSON.stringify(reminders));
    } catch (e) {
        console.error("Failed to save refill reminders", e);
    }
};