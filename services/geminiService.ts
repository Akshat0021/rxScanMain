import { GoogleGenAI, Type } from "@google/genai";
import type { PrescriptionData, ChatMessage, InteractionResult, PriceResult, PriceCheckResult, MedicationInfo } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const scanPrescription = async (file: File): Promise<PrescriptionData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    You are an AI-powered medical scribe specializing in digitizing handwritten prescriptions from India. Your task is to perform OCR on the provided image and extract the information into a precise JSON structure. Indian prescriptions often use abbreviations and specific formatting; pay close attention to these details.

    First, carefully scan the entire document to identify all sections. Then, extract the following information:

    - Patient Name: The full name of the patient.
    - Doctor Name: The doctor's name, often near a stamp or signature.
    - Date: The date the prescription was written.
    - Diagnosis: The primary diagnosis or symptoms listed.
    - Medications: This is the most critical part. Identify every single medication listed. For each one, create an object with these fields:
        - name: The brand or generic name of the medicine. Be as accurate as possible with spelling.
        - dosage: The strength of the medication (e.g., '500mg', '10ml'). If not written, use 'N/A'.
        - frequency: How often the medication should be taken. Interpret common Indian medical shorthand:
            - '1-0-1' means once in the morning, once at night.
            - '1-1-1' means morning, afternoon, and night.
            - 'BD' or 'BID' means twice daily.
            - 'TDS' or 'TID' means three times daily.
            - 'QID' means four times daily.
            - 'SOS' means take as needed.
            - 'HS' means at bedtime.
            Translate these into a clear, consistent format like "Twice a day (1-0-1)".
        - duration: The length of the treatment course (e.g., '5 days', '1 month'). If not specified, use 'N/A'.

    Crucial Instructions:
    - If a piece of information is genuinely unreadable or absent, use the string "N/A". Do not invent data.
    - Double-check that you have not missed any medications listed.
    - The output must be a valid JSON object matching the provided schema.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      patientName: { type: Type.STRING, description: "Patient's full name. N/A if not found." },
      doctorName: { type: Type.STRING, description: "Doctor's full name. N/A if not found." },
      date: { type: Type.STRING, description: "Date of prescription. N/A if not found." },
      diagnosis: { type: Type.STRING, description: "Brief diagnosis or reason for visit. N/A if not found." },
      medications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the medicine." },
            dosage: { type: Type.STRING, description: "Dosage strength, e.g., '500mg', '1 tablet'. N/A if not specified." },
            frequency: { type: Type.STRING, description: "How often to take it, e.g., '1-0-1', 'Twice a day', 'BD'. N/A if not specified." },
            duration: { type: Type.STRING, description: "For how long, e.g., '5 days', '1 month'. N/A if not specified." }
          },
          required: ["name", "dosage", "frequency", "duration"]
        }
      }
    },
    required: ["patientName", "doctorName", "date", "diagnosis", "medications"]
  };
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: [
        { text: prompt },
        imagePart,
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
    },
  });

  try {
    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("Received empty response from AI.");
    }
    const parsedData: PrescriptionData = JSON.parse(jsonText);
    
    // Check if the extracted data is meaningful
    const isDataEffectivelyEmpty = 
        (parsedData.patientName === 'N/A' || !parsedData.patientName) &&
        (parsedData.doctorName === 'N/A' || !parsedData.doctorName) &&
        (parsedData.diagnosis === 'N/A' || !parsedData.diagnosis) &&
        (!parsedData.medications || parsedData.medications.length === 0);

    if (isDataEffectivelyEmpty) {
        throw new Error("The AI could not extract any meaningful information. The response was empty.");
    }

    return parsedData;
  } catch (e) {
    console.error("Failed to parse or validate JSON response:", response.text, e);
    throw new Error("Could not parse the data from the prescription. The AI's response might be malformed or the image is too blurry.");
  }
};

export const verifyMedicationName = async (medicationName: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    // Don't try to verify if the OCR already failed and returned 'N/A' or an empty string.
    if (!medicationName || medicationName.trim().toLowerCase() === 'n/a') {
        return medicationName;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        You are a highly precise pharmacology data validation AI. Your sole purpose is to correct a single medication name extracted from a handwritten Indian prescription via OCR.

        The OCR-extracted text is: "${medicationName}"

        Follow these rules STRICTLY:
        1.  **Analyze:** The input might have spelling errors, missing parts, or be an abbreviation (e.g., 'Dolo 65', 'Calpol', 'Amox').
        2.  **Verify with Search:** Use Google Search to find the most probable, complete, and correctly spelled official medication name (brand or generic) available in India.
        3.  **Correction Criteria:**
            *   **High Confidence ONLY:** Only provide a correction if you are virtually certain it's the right one based on search results. A high-confidence match would be a very similar spelling for a common drug.
            *   **Preserve Dosage:** If the original text includes a dosage (e.g., '650', '500mg'), ensure the corrected version retains it. If the unit is missing (e.g., 'mg'), add it if it's standard for that drug. Example: 'Paracetamol 500' -> 'Paracetamol 500mg'.
            *   **Handle Abbreviations:** Expand common abbreviations. Example: 'Tab Crocin' -> 'Crocin Tablet'.
        4.  **Failure Condition:**
            *   **If you have ANY doubt, if the name seems nonsensical, or if you cannot find a high-confidence match, you MUST return the original, unchanged text: "${medicationName}"**. Do not guess. It is better to return the original OCR text than an incorrect guess.
        5.  **Output Format:**
            *   Your response must be a single line of text.
            *   It must contain ONLY the final medication name.
            *   DO NOT include any explanation, preamble, or markdown formatting.

        Example 1:
        Input: "Paracetmol 500"
        Output: "Paracetamol 500mg"

        Example 2:
        Input: "Crosin adv"
        Output: "Crocin Advance Tablet"

        Example 3:
        Input: "AlreadyCorrectMed"
        Output: "AlreadyCorrectMed"

        Example 4:
        Input: "GobblygookMed"
        Output: "GobblygookMed"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.0,
            },
        });

        const verifiedName = response.text.trim();
        
        // If the model returns an empty string or something that is clearly not a med name (e.g., a sentence), revert to original.
        if (!verifiedName || verifiedName.split(' ').length > 5 || verifiedName.includes('\n')) {
            console.warn(`Verification for "${medicationName}" returned an unexpected response: "${verifiedName}". Reverting to original.`);
            return medicationName;
        }
        
        return verifiedName;
    } catch (e) {
        console.error(`Error verifying medication name "${medicationName}":`, e);
        // If the API call fails, just return the original name to not break the flow.
        return medicationName;
    }
};


export const getChatResponse = async (history: ChatMessage[], prescriptionData: PrescriptionData | null): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const baseSystemInstruction = `You are a knowledgeable and empathetic health & wellness assistant. Your goal is to provide clear, easy-to-understand information on general health topics. Your tone should be supportive, professional, and reassuring. You are not a medical professional and you must never provide medical advice, diagnosis, or treatment plans. You must never identify yourself as an AI, a large language model, or a product of Google.`;

    let prescriptionContext = '';
    if (prescriptionData && prescriptionData.medications && prescriptionData.medications.length > 0) {
        const medicationList = prescriptionData.medications
            .map(med => med.name)
            .filter(name => name && name.toLowerCase() !== 'n/a')
            .join('\n- ');
        
        if (medicationList) {
            prescriptionContext = `
The user has scanned a prescription. Here are the medications listed on it:
- ${medicationList}

When the user asks about their "prescription", "meds", or specific medication names, use this list as context. You can explain what these medications are commonly used for, general side effects, and other helpful information.
`;
        }
    }

    const finalSystemInstruction = `
${prescriptionContext}
${baseSystemInstruction}

CRITICAL: At the end of every single response, you MUST include the following disclaimer on a new line: "Disclaimer: This is for informational purposes only and not a substitute for professional medical advice."`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: finalSystemInstruction,
        },
        history: history.slice(0, -1).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    });

    const lastMessage = history[history.length - 1];
    const result = await chat.sendMessage({ message: lastMessage.content });

    return result.text;
}

export const checkDrugInteractions = async (medicationNames: string[]): Promise<InteractionResult[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are a highly-trained pharmacology assistant AI. Your task is to analyze a list of medications for potential drug-drug interactions and provide a summary in a structured JSON format.

        Analyze the following list of medications:
        - ${medicationNames.join('\n- ')}

        For each significant interaction you identify, provide the following details:
        1.  'medications': An array containing the names of the two interacting drugs.
        2.  'severity': The severity of the interaction. This must be one of three values: "Major", "Moderate", or "Minor".
        3.  'description': A brief, easy-to-understand explanation of the potential interaction and its risks.

        Format your entire response as a single JSON array of interaction objects. If no significant interactions are found, return an empty array \`[]\`. Do not include any text or markdown formatting outside of the JSON array.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                medications: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "The two medications that interact."
                },
                severity: {
                    type: Type.STRING,
                    description: "Severity of the interaction: 'Major', 'Moderate', or 'Minor'."
                },
                description: {
                    type: Type.STRING,
                    description: "A clear, concise explanation of the interaction."
                }
            },
            required: ["medications", "severity", "description"]
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    try {
        const jsonText = response.text.trim();
        if (!jsonText) {
            console.warn("Received empty response for interaction check.");
            return [];
        }
        return JSON.parse(jsonText) as InteractionResult[];
    } catch (e) {
        console.error("Failed to parse drug interaction JSON response:", response.text, e);
        throw new Error("Could not parse the interaction data from the AI's response.");
    }
};

export const translatePrescription = async (prescription: PrescriptionData, targetLanguage: string): Promise<PrescriptionData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an expert medical translator. Your task is to translate the provided medical prescription JSON object into ${targetLanguage}.
        - Translate all string values: 'patientName', 'doctorName', 'date', 'diagnosis'.
        - For each item in the 'medications' array, translate the 'name', 'dosage', 'frequency', and 'duration' values.
        - The structure of the JSON object, including all keys and data types, MUST be preserved exactly as in the original.
        - Do not add, remove, or alter any keys. Only translate the string content.
        - If a value is 'N/A', keep it as 'N/A'.
        - The date format, if translated, should remain easily understandable.

        Here is the prescription data to translate:
        ${JSON.stringify(prescription, null, 2)}
    `;

    // Re-using the same schema from scanPrescription to enforce structure
    const schema = {
      type: Type.OBJECT,
      properties: {
        patientName: { type: Type.STRING },
        doctorName: { type: Type.STRING },
        date: { type: Type.STRING },
        diagnosis: { type: Type.STRING },
        medications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dosage: { type: Type.STRING },
              frequency: { type: Type.STRING },
              duration: { type: Type.STRING }
            },
            required: ["name", "dosage", "frequency", "duration"]
          }
        }
      },
      required: ["patientName", "doctorName", "date", "diagnosis", "medications"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.2,
        },
    });

    try {
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("Received empty translation response from AI.");
        }
        return JSON.parse(jsonText) as PrescriptionData;
    } catch (e) {
        console.error("Failed to parse translated JSON response:", response.text, e);
        throw new Error("Could not parse the translated data from the AI's response.");
    }
};

export const getMedicationPrices = async (medicationName: string): Promise<PriceCheckResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an intelligent price comparison assistant for medications in India.
        Your task is to find the best online prices for the medication: "${medicationName}".

        1. Use Google Search to find prices from popular, reputable online pharmacies in India (e.g., PharmEasy, 1mg, Netmeds, Apollo Pharmacy).
        2. Extract up to 5 of the best prices you can find.
        3. For each result, you must provide the pharmacy name, the price (formatted as a string with currency, e.g., "₹150.00 for 10 tablets"), and a direct URL to the product page.

        Your response MUST be a valid JSON array of objects with the following properties: "pharmacy", "price", "url".
        If you cannot find any prices, return an empty array \`[]\`.
        Do not include any text, explanation, or markdown formatting outside of the JSON array.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
        },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    try {
        let jsonText = response.text.trim();
        // The model might wrap the JSON in markdown backticks.
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        } else if (jsonText.startsWith('```')) {
             jsonText = jsonText.substring(3, jsonText.length - 3).trim();
        }

        if (!jsonText) {
            console.warn("Received empty response for price check.");
            return { prices: [], sources };
        }
        const prices = JSON.parse(jsonText) as PriceResult[];
        return { prices, sources };
    } catch (e) {
        console.error("Failed to parse price comparison JSON response:", response.text, e);
        throw new Error("Could not parse the price data from the AI's response.");
    }
};

export const getMedicationInfo = async (medicationName: string): Promise<MedicationInfo> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are a medical information AI. Provide a concise, easy-to-understand summary for the medication: "${medicationName}".
        The target audience is a patient, not a medical professional. Use clear, simple language.

        Structure your response as a JSON object with three keys:
        1. "uses": A brief paragraph explaining what the medication is commonly used for.
        2. "sideEffects": A paragraph listing a few common potential side effects. Do not be exhaustive, but mention important ones.
        3. "precautions": A paragraph outlining important precautions, such as taking it with food, avoiding alcohol, or potential drug interactions to discuss with a doctor.

        The entire response must be a single, valid JSON object. Do not include any text or markdown formatting outside of the JSON.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            uses: { type: Type.STRING, description: "Common uses of the medication." },
            sideEffects: { type: Type.STRING, description: "Common potential side effects." },
            precautions: { type: Type.STRING, description: "Important precautions to take." }
        },
        required: ["uses", "sideEffects", "precautions"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.3,
        },
    });
    
    try {
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("Received empty medication info response from AI.");
        }
        return JSON.parse(jsonText) as MedicationInfo;
    } catch (e) {
        console.error("Failed to parse medication info JSON response:", response.text, e);
        throw new Error("Could not parse the medication information from the AI's response.");
    }
};