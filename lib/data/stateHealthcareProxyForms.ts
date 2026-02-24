// State Healthcare Proxy Forms Database
// Top 5 states covering ~40% of US population

export interface OnlineService {
  name: string;
  url: string;
  affiliateUrl?: string;
  cost: string;
  features: string[];
  rating: number;
  stateSpecific: boolean;
}

export interface StateFormInfo {
  state: string;
  stateCode: string;
  population: number;

  formAvailability: "official" | "sample" | "none";

  form?: {
    title: string;
    officialSourceUrl: string;
    lastVerified: string;
    version: string;
    pageCount: number;
  };

  requirements: {
    notaryRequired: boolean;
    notaryRecommended: boolean;
    witnessCount: number;
    witnessRestrictions: string[];
    selfProving: boolean;
  };

  terminology: string;
  includesHIPAA: boolean;

  hostedPdfPath?: string;  // "/forms/advance-directives/CA.pdf"
  caringInfoLandingUrl: string;  // fallback for external link

  additionalForms?: Array<{
    name: string;
    description: string;
    recommended: boolean;
  }>;

  reciprocity: {
    acceptsOtherStates: boolean;
    notes?: string;
  };

  instructions: {
    fillOut: string[];
    witnesses: string[];
    distribution: string[];
  };

  commonPitfalls: string[];

  onlineServiceRecommendations: OnlineService[];

  estimatedCompletionTime: string;

  notes?: string;
}

export const STATE_FORMS_DATABASE: Record<string, StateFormInfo> = {

  CA: {
    state: "California",
    stateCode: "CA",
    population: 39_538_223,
    formAvailability: "official",

    form: {
      title: "Advance Health Care Directive",
      officialSourceUrl: "https://oag.ca.gov/consumers/general/adv_hc_dir",
      lastVerified: "2025-01-15",
      version: "Rev. 2023",
      pageCount: 10
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your healthcare provider",
        "Cannot be an employee of your healthcare provider",
        "Cannot be the operator of a community care facility",
        "At least one witness cannot be related to you by blood/marriage/adoption",
        "At least one witness cannot be entitled to any part of your estate"
      ],
      selfProving: true
    },

    terminology: "Advance Health Care Directive",
    includesHIPAA: false,

    hostedPdfPath: "/forms/advance-directives/CA.pdf",
    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/california/",

    additionalForms: [
      {
        name: "HIPAA Authorization",
        description: "Allows your agent to access medical records",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "CA accepts out-of-state directives if they meet CA requirements"
    },

    instructions: {
      fillOut: [
        "Read the entire form first (it includes educational content)",
        "Part 1: Name your agent (healthcare decision maker)",
        "Part 2: State your healthcare wishes (optional but recommended)",
        "Part 3: Donation of organs (optional)",
        "Part 4: Sign and date in front of witnesses OR notary"
      ],
      witnesses: [
        "Find 2 witnesses who meet the restrictions above",
        "OR use a notary instead of witnesses",
        "OR use 1 witness + 1 notary"
      ],
      distribution: [
        "Give a copy to your primary care doctor",
        "Give a copy to your agent (the person you named)",
        "Keep original in safe but accessible place",
        "Consider registering with CA Advance Healthcare Directive Registry (optional)"
      ]
    },

    commonPitfalls: [
      "Form is 10 pages - don't print only page 1",
      "Witness restrictions are complex - read carefully",
      "Many people skip Part 2 (healthcare wishes) - consider filling it out",
      "Forgetting to give copy to doctor means it won't be in medical records"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/california",
        affiliateUrl: "https://mamabear.legal/california?ref=harbor",
        cost: "$99",
        features: [
          "Guided step-by-step process",
          "Includes HIPAA authorization",
          "Video notary included",
          "1 year of free updates"
        ],
        rating: 4.8,
        stateSpecific: true
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$79 + $49 notary",
        features: [
          "Well-known service",
          "Attorney review available (+$199)",
          "Good customer support"
        ],
        rating: 4.5,
        stateSpecific: true
      }
    ],

    estimatedCompletionTime: "1-2 hours",

    notes: "CA form is very comprehensive but can be overwhelming. Consider using online service if you want guidance."
  },

  TX: {
    state: "Texas",
    stateCode: "TX",
    population: 29_145_505,
    formAvailability: "official",

    form: {
      title: "Medical Power of Attorney",
      officialSourceUrl: "https://www.texas.gov/living-in-texas/health-and-safety/",
      lastVerified: "2025-01-15",
      version: "Statutory Form 2023",
      pageCount: 6
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your healthcare provider",
        "Cannot be an employee of your healthcare provider",
        "At least one witness cannot be related to you",
        "Cannot be named as agent in the document"
      ],
      selfProving: true
    },

    terminology: "Medical Power of Attorney",
    includesHIPAA: true,

    hostedPdfPath: "/forms/advance-directives/TX.pdf",
    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/texas/",

    reciprocity: {
      acceptsOtherStates: true
    },

    instructions: {
      fillOut: [
        "Fill in your name and information",
        "Name your agent (primary) and successor agents",
        "Initial the powers you want to grant (pre-printed options)",
        "Sign in front of notary AND 2 witnesses"
      ],
      witnesses: [
        "Must have 2 witnesses PLUS notary (TX requirement)",
        "All three (you, witnesses, notary) must be present at same time",
        "Witnesses must meet restrictions above"
      ],
      distribution: [
        "Give copy to agent",
        "Give copy to doctor",
        "Keep original in accessible location",
        "Consider giving copy to hospital if parent has recurring visits"
      ]
    },

    commonPitfalls: [
      "Forgetting notary - TX requires it (unlike many states)",
      "Not having all parties present at once",
      "Forgetting to initial the specific powers you want to grant"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/texas",
        affiliateUrl: "https://mamabear.legal/texas?ref=harbor",
        cost: "$89",
        features: [
          "Includes video notary (saves trip)",
          "Witnesses can be remote in some cases",
          "Texas-specific guidance"
        ],
        rating: 4.8,
        stateSpecific: true
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$79 + $49 notary",
        features: [
          "Well-known brand",
          "Good customer support",
          "Attorney review available"
        ],
        rating: 4.5,
        stateSpecific: true
      }
    ],

    estimatedCompletionTime: "45 minutes",

    notes: "TX requires notary, which is more restrictive than many states. Online service with video notary is highly recommended."
  },

  FL: {
    state: "Florida",
    stateCode: "FL",
    population: 21_538_187,
    formAvailability: "official",

    form: {
      title: "Designation of Health Care Surrogate",
      officialSourceUrl: "http://www.floridahealthfinder.gov/researchers/orderform/order-form.aspx",
      lastVerified: "2025-01-15",
      version: "Form 765.202, Rev. 01/2024",
      pageCount: 2
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be the designated surrogate",
        "Cannot be your healthcare provider"
      ],
      selfProving: false
    },

    terminology: "Healthcare Surrogate",
    includesHIPAA: false,

    hostedPdfPath: "/forms/advance-directives/FL.pdf",
    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/florida/",

    additionalForms: [
      {
        name: "Living Will",
        description: "Specifies end-of-life care wishes",
        recommended: true
      },
      {
        name: "HIPAA Authorization",
        description: "Allows surrogate to access medical records",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "Important for snowbirds - FL accepts other states' forms, but recommend having FL-specific one on file"
    },

    instructions: {
      fillOut: [
        "Print 3 copies of the form",
        "Fill in your name and address",
        "Fill in surrogate's name and contact info",
        "Fill in alternate surrogate (optional but recommended)",
        "Sign and date in front of 2 witnesses"
      ],
      witnesses: [
        "Witnesses can be neighbors, friends, coworkers",
        "Cannot be you, the surrogate, or your doctor",
        "Both witnesses must be present when you sign"
      ],
      distribution: [
        "Copy 1: Give to your surrogate",
        "Copy 2: Give to your primary care doctor",
        "Copy 3: Keep in your personal files"
      ]
    },

    commonPitfalls: [
      "Forgetting to name an alternate surrogate",
      "Not getting notarized (not required but highly recommended)",
      "Not pairing with a Living Will (should do both)",
      "Snowbirds: having FL surrogate but spending time in other states"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/florida",
        affiliateUrl: "https://mamabear.legal/florida?ref=harbor",
        cost: "$89",
        features: [
          "Bundles Healthcare Surrogate + Living Will + HIPAA",
          "Video notary included",
          "Snowbird package available (FL + northern state)"
        ],
        rating: 4.9,
        stateSpecific: true
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$79",
        features: [
          "Simple guided process",
          "Notary add-on available",
          "Fast turnaround"
        ],
        rating: 4.6,
        stateSpecific: true
      }
    ],

    estimatedCompletionTime: "30 minutes",

    notes: "FL is one of the easiest states - simple 2-page form, minimal requirements. Perfect for DIY."
  },

  NY: {
    state: "New York",
    stateCode: "NY",
    population: 20_201_249,
    formAvailability: "official",

    form: {
      title: "Health Care Proxy",
      officialSourceUrl: "https://www.health.ny.gov/professionals/patients/health_care_proxy/",
      lastVerified: "2025-01-15",
      version: "DOH-1430, Rev. 2023",
      pageCount: 4
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: false,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your healthcare agent",
        "If in hospital/nursing home, one witness must be witness coordinator"
      ],
      selfProving: false
    },

    terminology: "Health Care Proxy",
    includesHIPAA: false,

    hostedPdfPath: "/forms/advance-directives/NY.pdf",
    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/new-york/",

    additionalForms: [
      {
        name: "MOLST (Medical Orders for Life-Sustaining Treatment)",
        description: "For people with serious illness - must be signed by doctor",
        recommended: false
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "NY is generally reciprocal but prefers NY-specific forms"
    },

    instructions: {
      fillOut: [
        "Use exact statutory language (don't modify the form)",
        "Name your healthcare agent and alternate",
        "Specify any limitations (optional)",
        "Specify wishes about organ donation (optional)",
        "Sign and date in front of 2 witnesses"
      ],
      witnesses: [
        "Cannot be your agent",
        "Special rule: If you're in a hospital or nursing home when signing, one witness must be the facility's 'witness coordinator'",
        "If signing at home, any 2 adults can witness"
      ],
      distribution: [
        "Give copy to agent",
        "Give copy to alternate agent",
        "Give copy to your doctor",
        "Keep original accessible"
      ]
    },

    commonPitfalls: [
      "Modifying the statutory language (invalidates it in NY)",
      "If in facility, not using witness coordinator",
      "Not discussing wishes with agent before appointing them"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/new-york",
        affiliateUrl: "https://mamabear.legal/new-york?ref=harbor",
        cost: "$89",
        features: [
          "Ensures statutory language is preserved",
          "Includes HIPAA authorization",
          "NYC-specific guidance"
        ],
        rating: 4.7,
        stateSpecific: true
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$79",
        features: [
          "Familiar with NY requirements",
          "Good support team",
          "Quick turnaround"
        ],
        rating: 4.5,
        stateSpecific: true
      }
    ],

    estimatedCompletionTime: "45 minutes",

    notes: "NY is strict about using exact statutory language - don't modify the form."
  },

  PA: {
    state: "Pennsylvania",
    stateCode: "PA",
    population: 13_002_700,
    formAvailability: "official",

    form: {
      title: "Health Care Power of Attorney",
      officialSourceUrl: "https://www.health.pa.gov/topics/Documents/Programs/BFCC-HCPOA.pdf",
      lastVerified: "2025-01-15",
      version: "Rev. 2023",
      pageCount: 5
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your health care agent",
        "Cannot be your health care provider",
        "Cannot be an owner/operator/employee of your health care provider"
      ],
      selfProving: true
    },

    terminology: "Health Care Power of Attorney",
    includesHIPAA: false,

    hostedPdfPath: "/forms/advance-directives/PA.pdf",
    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/pennsylvania/",

    additionalForms: [
      {
        name: "Living Will",
        description: "Pennsylvania's declaration regarding life-sustaining treatment",
        recommended: true
      },
      {
        name: "HIPAA Authorization",
        description: "Separate form needed for medical record access",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "PA generally accepts other states' healthcare proxies"
    },

    instructions: {
      fillOut: [
        "Read all instructions on the form carefully",
        "Fill in your name and information",
        "Designate your primary health care agent",
        "Designate successor agents (recommended)",
        "Specify any limitations or special instructions",
        "Sign in front of 2 witnesses"
      ],
      witnesses: [
        "Must have 2 witnesses who meet restrictions",
        "Notarization is optional but recommended",
        "Witnesses must be present when you sign"
      ],
      distribution: [
        "Give copy to your health care agent",
        "Give copy to successor agents",
        "Give copy to your doctor(s)",
        "Keep original in secure but accessible location"
      ]
    },

    commonPitfalls: [
      "Not clearly specifying limitations or wishes",
      "Forgetting to name successor agents",
      "Not pairing with Living Will (should have both)",
      "Witnesses being healthcare providers (invalidates)"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/pennsylvania",
        affiliateUrl: "https://mamabear.legal/pennsylvania?ref=harbor",
        cost: "$89",
        features: [
          "Bundles Healthcare POA + Living Will + HIPAA",
          "Pennsylvania-specific guidance",
          "Optional notary service"
        ],
        rating: 4.7,
        stateSpecific: true
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$79",
        features: [
          "Simple step-by-step process",
          "Customer support",
          "Notary available"
        ],
        rating: 4.5,
        stateSpecific: true
      }
    ],

    estimatedCompletionTime: "45 minutes",

    notes: "PA form is straightforward. Highly recommend pairing with Living Will for complete advance care planning."
  },

  MA: {
    state: "Massachusetts",
    stateCode: "MA",
    population: 7_029_917,
    formAvailability: "official",

    form: {
      title: "Health Care Proxy",
      officialSourceUrl: "https://www.mass.gov/info-details/health-care-proxy-information",
      lastVerified: "2025-01-15",
      version: "Rev. 2023",
      pageCount: 4
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: false,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your health care agent or alternate agent",
        "Cannot be your health care provider or employee of your provider"
      ],
      selfProving: false
    },

    terminology: "Health Care Proxy",
    includesHIPAA: false,

    hostedPdfPath: "/forms/advance-directives/MA.pdf",
    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/massachusetts/",

    additionalForms: [
      {
        name: "MOLST (Medical Orders for Life-Sustaining Treatment)",
        description: "For people with serious illness - must be signed by doctor",
        recommended: false
      },
      {
        name: "HIPAA Authorization",
        description: "Allows your agent to access medical records",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "MA generally recognizes out-of-state health care proxies"
    },

    instructions: {
      fillOut: [
        "Fill in your name, date of birth, and address",
        "Name your health care agent and provide their contact info",
        "Name an alternate agent (optional but recommended)",
        "Add any specific instructions or limitations (optional)",
        "Sign and date in front of 2 witnesses"
      ],
      witnesses: [
        "Must have 2 witnesses who are 18 or older",
        "Witnesses cannot be your health care agent or alternate",
        "Both witnesses must be present when you sign"
      ],
      distribution: [
        "Give a copy to your health care agent",
        "Give a copy to your alternate agent",
        "Give a copy to your primary care doctor",
        "Keep original in an accessible location"
      ]
    },

    commonPitfalls: [
      "Not discussing your wishes with your agent before appointing them",
      "Forgetting to name an alternate agent",
      "Not giving a copy to your doctor (it won't be in your medical record)",
      "Confusing Health Care Proxy with a living will (MA doesn't have a statutory living will form)"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/massachusetts",
        affiliateUrl: "https://mamabear.legal/massachusetts?ref=harbor",
        cost: "$89",
        features: [
          "Includes HIPAA authorization",
          "Massachusetts-specific guidance",
          "Step-by-step process"
        ],
        rating: 4.7,
        stateSpecific: true
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$79",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround"
        ],
        rating: 4.5,
        stateSpecific: true
      }
    ],

    estimatedCompletionTime: "30 minutes",

    notes: "MA Health Care Proxy is straightforward. Note that MA does not have a statutory living will form - wishes are communicated through the proxy document itself."
  }
};

// Helper functions
export function getStateFormInfo(stateCode: string): StateFormInfo | null {
  return STATE_FORMS_DATABASE[stateCode.toUpperCase()] || null;
}

export function getSupportedStates(): string[] {
  return Object.keys(STATE_FORMS_DATABASE);
}

export function isStateSupported(stateCode: string): boolean {
  return stateCode.toUpperCase() in STATE_FORMS_DATABASE;
}

export function getFormComplexity(stateCode: string): "easy" | "moderate" | "complex" | null {
  const info = getStateFormInfo(stateCode);
  if (!info) return null;

  // Determine complexity based on requirements
  const hasNotary = info.requirements.notaryRequired;
  const pageCount = info.form?.pageCount || 0;
  const witnessRestrictions = info.requirements.witnessRestrictions.length;

  if (hasNotary || pageCount > 8 || witnessRestrictions > 3) {
    return "complex";
  } else if (pageCount > 4 || witnessRestrictions > 2) {
    return "moderate";
  } else {
    return "easy";
  }
}

export function getRecommendedApproach(
  stateCode: string,
  familyComplexity: "simple" | "moderate" | "complex" = "simple"
): "state_form" | "online_service" | "attorney" {
  const info = getStateFormInfo(stateCode);
  if (!info) return "online_service";

  const formComplexity = getFormComplexity(stateCode);

  // If family situation is complex, always recommend attorney
  if (familyComplexity === "complex") {
    return "attorney";
  }

  // If state form is easy and family is simple, recommend DIY
  if (formComplexity === "easy" && familyComplexity === "simple" && info.formAvailability === "official") {
    return "state_form";
  }

  // Default to online service for most cases
  return "online_service";
}
