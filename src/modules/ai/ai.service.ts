const SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Gastroenterology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "General Medicine",
] as const;

type Urgency = "low" | "medium" | "high";

const keywordMap: Record<string, { specialty: string; urgency: Urgency }> = {
  chest: { specialty: "Cardiology", urgency: "high" },
  "chest pain": { specialty: "Cardiology", urgency: "high" },
  palpitations: { specialty: "Cardiology", urgency: "medium" },
  "shortness of breath": { specialty: "Pulmonology", urgency: "high" },
  cough: { specialty: "Pulmonology", urgency: "low" },
  fever: { specialty: "General Medicine", urgency: "medium" },
  headache: { specialty: "Neurology", urgency: "low" },
  migraine: { specialty: "Neurology", urgency: "medium" },
  rash: { specialty: "Dermatology", urgency: "low" },
  "skin rash": { specialty: "Dermatology", urgency: "low" },
  "back pain": { specialty: "Orthopedics", urgency: "low" },
  "joint pain": { specialty: "Orthopedics", urgency: "low" },
  fracture: { specialty: "Orthopedics", urgency: "high" },
  nausea: { specialty: "Gastroenterology", urgency: "medium" },
  vomiting: { specialty: "Gastroenterology", urgency: "medium" },
  diarrhea: { specialty: "Gastroenterology", urgency: "low" },
  "abdominal pain": { specialty: "Gastroenterology", urgency: "medium" },
  depression: { specialty: "Psychiatry", urgency: "medium" },
  anxiety: { specialty: "Psychiatry", urgency: "medium" },
  "sore throat": { specialty: "General Medicine", urgency: "low" },
  "ear pain": { specialty: "General Medicine", urgency: "low" },
  dizziness: { specialty: "Neurology", urgency: "medium" },
  fatigue: { specialty: "General Medicine", urgency: "low" },
  "high blood pressure": { specialty: "Cardiology", urgency: "medium" },
  diabetes: { specialty: "General Medicine", urgency: "medium" },
};

const symptomCheck = async (symptoms: string): Promise<{ suggestedSpecialty: string; urgency: string }> => {
  const lower = symptoms.toLowerCase();

  for (const [keyword, mapping] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      return { suggestedSpecialty: mapping.specialty, urgency: mapping.urgency };
    }
  }

  return { suggestedSpecialty: "General Medicine", urgency: "low" };
};

export const aiService = {
  symptomCheck,
};
