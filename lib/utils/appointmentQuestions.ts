// AI Doctor Questions — client-side heuristic question generator for appointment prep

export interface SuggestedQuestion {
  id: string;
  question: string;
  category: string;
}

const SEDATING_MEDICATIONS = [
  "zolpidem", "ambien",
  "trazodone", "desyrel",
  "gabapentin", "neurontin",
  "pregabalin", "lyrica",
  "lorazepam", "ativan",
  "diazepam", "valium",
  "clonazepam", "klonopin",
  "alprazolam", "xanax",
  "diphenhydramine", "benadryl",
  "hydroxyzine", "vistaril", "atarax",
  "quetiapine", "seroquel",
  "olanzapine", "zyprexa",
  "mirtazapine", "remeron",
  "amitriptyline", "elavil",
  "doxepin", "sinequan",
  "cyclobenzaprine", "flexeril",
  "oxycodone", "oxycontin",
  "hydrocodone", "vicodin",
  "morphine",
  "tramadol", "ultram",
];

const CONDITION_QUESTIONS: Record<string, SuggestedQuestion[]> = {
  diabetes: [
    { id: "diabetes_a1c", question: "What is the current A1C, and is it at goal?", category: "Diabetes" },
    { id: "diabetes_feet", question: "Have foot exams and eye exams been done this year?", category: "Diabetes" },
    { id: "diabetes_kidney", question: "Are kidney function tests up to date?", category: "Diabetes" },
  ],
  "heart failure": [
    { id: "hf_weight", question: "What weight changes should trigger a call to the doctor?", category: "Heart Failure" },
    { id: "hf_sodium", question: "What is the sodium and fluid restriction?", category: "Heart Failure" },
    { id: "hf_ejection", question: "What is the current ejection fraction?", category: "Heart Failure" },
  ],
  copd: [
    { id: "copd_action", question: "Is there a COPD action plan for flare-ups?", category: "COPD" },
    { id: "copd_pulm", question: "When is the next pulmonary function test?", category: "COPD" },
    { id: "copd_vaccines", question: "Are pneumonia and flu vaccines up to date?", category: "COPD" },
  ],
  hypertension: [
    { id: "htn_target", question: "What is the blood pressure target?", category: "Hypertension" },
    { id: "htn_home", question: "Should we be monitoring blood pressure at home?", category: "Hypertension" },
  ],
  "atrial fibrillation": [
    { id: "afib_anticoag", question: "Is anticoagulation therapy appropriate? What are the bleeding risks?", category: "AFib" },
    { id: "afib_rate", question: "What is the target heart rate?", category: "AFib" },
  ],
  dementia: [
    { id: "dementia_stage", question: "What stage of cognitive decline are we in?", category: "Cognitive" },
    { id: "dementia_safety", question: "Are there safety concerns (driving, wandering, cooking)?", category: "Cognitive" },
    { id: "dementia_plan", question: "Should we update the advance directive or care plan?", category: "Cognitive" },
  ],
  alzheimer: [
    { id: "alz_meds", question: "Are current Alzheimer's medications still appropriate?", category: "Cognitive" },
    { id: "alz_behavior", question: "How should we manage behavioral changes?", category: "Cognitive" },
  ],
  osteoporosis: [
    { id: "osteo_dexa", question: "When is the next bone density (DEXA) scan?", category: "Bone Health" },
    { id: "osteo_calcium", question: "Are calcium and vitamin D levels adequate?", category: "Bone Health" },
  ],
  depression: [
    { id: "dep_screen", question: "Should we do a depression screening?", category: "Mental Health" },
    { id: "dep_meds", question: "Are current medications effective for mood management?", category: "Mental Health" },
  ],
  "chronic kidney": [
    { id: "ckd_stage", question: "What stage of kidney disease are we in?", category: "Kidney" },
    { id: "ckd_diet", question: "Are there dietary restrictions for kidney health?", category: "Kidney" },
  ],
  cancer: [
    { id: "cancer_followup", question: "What is the surveillance schedule for follow-up screenings?", category: "Oncology" },
    { id: "cancer_sideeffects", question: "Are there long-term side effects from treatment to watch for?", category: "Oncology" },
  ],
};

export function generateContextualQuestions(
  meds: Array<{ name: string }>,
  conditions: string[],
  profile: { age?: number; whatMattersMost?: string } | null,
  recentEventTypes?: string[]
): SuggestedQuestion[] {
  const questions = new Map<string, SuggestedQuestion>();

  const add = (q: SuggestedQuestion) => {
    if (!questions.has(q.id)) {
      questions.set(q.id, q);
    }
  };

  // --- Polypharmacy ---
  if (meds.length >= 8) {
    add({
      id: "poly_simplify",
      question: "Can any medications be simplified, consolidated, or stopped? (Currently taking " + meds.length + " medications)",
      category: "Medications",
    });
  } else if (meds.length >= 5) {
    add({
      id: "poly_review",
      question: "Can we review the medication list for possible simplification? (Currently taking " + meds.length + " medications)",
      category: "Medications",
    });
  }

  // --- Sedating medications ---
  const medNamesLower = meds.map((m) => m.name.toLowerCase());
  const sedatingFound = medNamesLower.filter((name) =>
    SEDATING_MEDICATIONS.some((sed) => name.includes(sed))
  );
  if (sedatingFound.length > 0) {
    add({
      id: "sedation_fall",
      question: "Are there fall-risk or sedation concerns with current medications?",
      category: "Fall Prevention",
    });
  }

  // --- Age-based ---
  const age = profile?.age;
  if (age && age >= 80) {
    add({
      id: "age_bone",
      question: "Is a bone density screening appropriate?",
      category: "Preventive",
    });
    add({
      id: "age_fall",
      question: "What fall prevention measures should we take?",
      category: "Fall Prevention",
    });
  }
  if (age && age >= 65) {
    add({
      id: "age_cognitive",
      question: "Should we do a cognitive screening?",
      category: "Preventive",
    });
  }

  // --- Condition-specific ---
  const conditionsLower = conditions.map((c) => c.toLowerCase());
  for (const [keyword, condQuestions] of Object.entries(CONDITION_QUESTIONS)) {
    if (conditionsLower.some((c) => c.includes(keyword))) {
      for (const q of condQuestions) {
        add(q);
      }
    }
  }

  // --- Recent life events ---
  if (recentEventTypes) {
    if (recentEventTypes.includes("hospitalization")) {
      add({
        id: "event_hospital",
        question: "Can we review recovery from the recent hospitalization?",
        category: "Follow-Up",
      });
    }
    if (recentEventTypes.includes("fall")) {
      add({
        id: "event_fall",
        question: "What can we do to prevent future falls?",
        category: "Fall Prevention",
      });
    }
    if (recentEventTypes.includes("new_diagnosis")) {
      add({
        id: "event_diagnosis",
        question: "Can we review the recent diagnosis and treatment plan?",
        category: "Follow-Up",
      });
    }
  }

  return Array.from(questions.values());
}
