// State Healthcare Proxy Forms Database
// Top 16 states by population covering ~70% of US population

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
  },

  OH: {
    state: "Ohio",
    stateCode: "OH",
    population: 11_799_448,
    formAvailability: "official",

    form: {
      title: "Health Care Power of Attorney",
      officialSourceUrl: "https://www.aging.ohio.gov/resources/advance-directives",
      lastVerified: "2025-01-15",
      version: "ORC 1337.12",
      pageCount: 6
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your attending physician",
        "Cannot be the administrator of the nursing home where you reside",
        "2 witnesses OR notary (either/or, not both required)"
      ],
      selfProving: false
    },

    terminology: "Health Care Power of Attorney",
    includesHIPAA: false,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/ohio/",

    additionalForms: [
      {
        name: "Living Will Declaration",
        description: "Separate document for end-of-life treatment preferences",
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
      notes: "OH generally recognizes out-of-state advance directives"
    },

    instructions: {
      fillOut: [
        "Fill in your name and personal information",
        "Designate your attorney-in-fact (agent) for health care",
        "Optionally designate successor agents",
        "Specify any limitations on the agent's authority",
        "Sign in front of 2 witnesses OR a notary"
      ],
      witnesses: [
        "You need 2 witnesses OR a notary public (not both)",
        "Witnesses cannot be your attending physician",
        "Witnesses cannot be the administrator of your nursing home"
      ],
      distribution: [
        "Give a copy to your agent",
        "Give a copy to your primary care doctor",
        "Keep original in an accessible location",
        "Inform family members of the document's existence and location"
      ]
    },

    commonPitfalls: [
      "Confusing the either/or rule: you need 2 witnesses OR a notary, not both",
      "Not pairing with a Living Will Declaration (separate form in OH)",
      "Forgetting to give copy to your physician",
      "Not discussing specific wishes with your agent"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/ohio",
        affiliateUrl: "https://mamabear.legal/ohio?ref=harbor",
        cost: "$89",
        features: [
          "Ohio-specific guidance",
          "Includes Living Will + HIPAA bundle",
          "Video notary included"
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

    estimatedCompletionTime: "30-60 minutes",

    notes: "OH allows 2 witnesses OR notary (either/or). Recommend notarizing for extra validity."
  },

  IL: {
    state: "Illinois",
    stateCode: "IL",
    population: 12_812_508,
    formAvailability: "official",

    form: {
      title: "Power of Attorney for Health Care",
      officialSourceUrl: "https://www.illinois.gov/services/health/advance-directives",
      lastVerified: "2025-01-15",
      version: "755 ILCS 45",
      pageCount: 7
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: false,
      witnessCount: 1,
      witnessRestrictions: [
        "Cannot be your healthcare agent",
        "Cannot be your healthcare provider or their employee",
        "Cannot be the owner/operator of a residential care facility where you reside",
        "Note: POA for Health Care requires 1 witness; separate Living Will requires 2 witnesses"
      ],
      selfProving: false
    },

    terminology: "Power of Attorney for Health Care",
    includesHIPAA: true,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/illinois/",

    additionalForms: [
      {
        name: "Declaration (Living Will)",
        description: "Separate document for end-of-life treatment wishes; requires 2 witnesses",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "IL generally recognizes out-of-state advance directives"
    },

    instructions: {
      fillOut: [
        "Fill in your name and personal information",
        "Name your agent for healthcare decisions",
        "Optionally name a successor agent",
        "Specify the powers you are granting",
        "Add any limitations or special instructions",
        "Sign in front of 1 witness"
      ],
      witnesses: [
        "POA for Health Care requires only 1 witness",
        "If also completing a Living Will, that requires 2 witnesses",
        "Witness must meet the restrictions listed above"
      ],
      distribution: [
        "Give a copy to your agent",
        "Give a copy to your doctor",
        "Keep the original in a safe, accessible location",
        "Inform family members about the document"
      ]
    },

    commonPitfalls: [
      "Confusing witness requirements: POA needs 1 witness, Living Will needs 2",
      "Not realizing these are two separate documents in IL",
      "Forgetting to discuss specific wishes with your agent",
      "Not giving a copy to your healthcare provider"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/illinois",
        affiliateUrl: "https://mamabear.legal/illinois?ref=harbor",
        cost: "$89",
        features: [
          "Bundles POA + Living Will",
          "Illinois-specific guidance",
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

    estimatedCompletionTime: "30-45 minutes",

    notes: "IL has separate documents for POA (1 witness) and Living Will (2 witnesses). The POA includes HIPAA authorization language."
  },

  GA: {
    state: "Georgia",
    stateCode: "GA",
    population: 10_711_908,
    formAvailability: "official",

    form: {
      title: "Advance Directive for Health Care",
      officialSourceUrl: "https://aging.georgia.gov/advance-directives",
      lastVerified: "2025-01-15",
      version: "GA Code Title 31, Ch. 32",
      pageCount: 15
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be the person appointed as your agent",
        "Cannot be your healthcare provider or their employee",
        "Cannot be the operator or employee of a healthcare facility where you are a patient/resident",
        "At least one witness cannot be related to you by blood, marriage, or adoption"
      ],
      selfProving: false
    },

    terminology: "Advance Directive for Health Care",
    includesHIPAA: false,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/georgia/",

    additionalForms: [
      {
        name: "HIPAA Authorization",
        description: "Separate authorization for medical record access",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "GA recognizes out-of-state advance directives if they meet GA requirements"
    },

    instructions: {
      fillOut: [
        "Read all sections of the form (it is 14-15 pages)",
        "Part One: Appoint your healthcare agent and successor",
        "Part Two: State your treatment preferences",
        "Part Three: Specify organ donation wishes (optional)",
        "Part Four: Nominate a guardian (optional)",
        "Sign and date in front of 2 witnesses"
      ],
      witnesses: [
        "Must have 2 witnesses present when you sign",
        "At least one witness cannot be a relative by blood, marriage, or adoption",
        "Witnesses must meet all restrictions listed above"
      ],
      distribution: [
        "Give a copy to your healthcare agent",
        "Give a copy to your primary care doctor",
        "Keep the original in a safe, accessible place",
        "Consider giving copies to close family members"
      ]
    },

    commonPitfalls: [
      "Form is 14-15 pages — don't be intimidated, read through before filling out",
      "GA consolidated separate Living Will + POA into one form in 2007; older separate forms may still be valid",
      "Not having at least one unrelated witness",
      "Skipping the treatment preferences section (Part Two)"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/georgia",
        affiliateUrl: "https://mamabear.legal/georgia?ref=harbor",
        cost: "$89",
        features: [
          "Georgia-specific guidance",
          "Simplifies the 15-page form",
          "Includes HIPAA authorization"
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

    estimatedCompletionTime: "45-90 minutes",

    notes: "GA's consolidated form replaced separate Living Will and POA in 2007. It's comprehensive but lengthy (14-15 pages). Consider an online service for guided completion."
  },

  NC: {
    state: "North Carolina",
    stateCode: "NC",
    population: 10_439_388,
    formAvailability: "official",

    form: {
      title: "Health Care Power of Attorney",
      officialSourceUrl: "https://www.ncdhhs.gov/divisions/aging-and-adult-services/advance-directives",
      lastVerified: "2025-01-15",
      version: "NCGS 32A-25.1",
      pageCount: 8
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be related to you by blood or marriage",
        "Cannot be entitled to any part of your estate",
        "Cannot be your attending physician or their employee",
        "Cannot be an employee of a health care facility where you are a patient",
        "NC requires BOTH 2 witnesses AND notarization"
      ],
      selfProving: true
    },

    terminology: "Health Care Power of Attorney",
    includesHIPAA: false,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/north-carolina/",

    additionalForms: [
      {
        name: "Advance Directive for a Natural Death (Living Will)",
        description: "Separate document specifying end-of-life treatment wishes",
        recommended: true
      },
      {
        name: "HIPAA Authorization",
        description: "Separate authorization for medical record access",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "NC recognizes out-of-state advance directives"
    },

    instructions: {
      fillOut: [
        "Fill in your name and personal information",
        "Name your healthcare agent",
        "Name a successor agent (recommended)",
        "Specify any limitations on your agent's authority",
        "Sign in front of 2 witnesses AND a notary public"
      ],
      witnesses: [
        "NC is one of the strictest states: you need BOTH 2 witnesses AND a notary",
        "Witnesses cannot be related to you by blood or marriage",
        "Witnesses cannot be entitled to any part of your estate",
        "All parties (you, witnesses, notary) should be present at signing"
      ],
      distribution: [
        "Give a copy to your healthcare agent",
        "Give a copy to your doctor",
        "Keep the original in a safe, accessible location",
        "Consider filing with the county Register of Deeds"
      ]
    },

    commonPitfalls: [
      "NC requires BOTH witnesses AND notary — the strictest requirement of any state",
      "Witnesses cannot be related — plan ahead to find unrelated witnesses",
      "Not having all parties present at the same signing session",
      "Forgetting that Living Will is a separate document in NC"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/north-carolina",
        affiliateUrl: "https://mamabear.legal/north-carolina?ref=harbor",
        cost: "$99",
        features: [
          "Handles notary + witness coordination",
          "NC-specific guidance for strict requirements",
          "Bundles Healthcare POA + Living Will + HIPAA"
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
          "Notary add-on available",
          "Customer support"
        ],
        rating: 4.5,
        stateSpecific: true
      }
    ],

    estimatedCompletionTime: "45-75 minutes",

    notes: "NC has the strictest signing requirements: BOTH 2 witnesses AND notary are required. Plan the signing session carefully and ensure all parties can be present."
  },

  NJ: {
    state: "New Jersey",
    stateCode: "NJ",
    population: 9_288_994,
    formAvailability: "official",

    form: {
      title: "Proxy Directive",
      officialSourceUrl: "https://www.nj.gov/health/advancedirective/",
      lastVerified: "2025-01-15",
      version: "NJSA 26:2H-55",
      pageCount: 4
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your healthcare representative (agent)",
        "2 witnesses OR notary (either/or, not both required)"
      ],
      selfProving: false
    },

    terminology: "Proxy Directive",
    includesHIPAA: false,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/new-jersey/",

    additionalForms: [
      {
        name: "Instruction Directive (Living Will)",
        description: "Separate document for specifying treatment preferences",
        recommended: true
      },
      {
        name: "HIPAA Authorization",
        description: "Separate authorization for medical record access",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "NJ generally recognizes out-of-state advance directives"
    },

    instructions: {
      fillOut: [
        "Fill in your name and personal information",
        "Name your healthcare representative",
        "Name an alternate representative (recommended)",
        "Add any specific instructions or limitations",
        "Sign in front of 2 witnesses OR a notary"
      ],
      witnesses: [
        "You need 2 witnesses OR a notary (not both)",
        "Witnesses cannot be your healthcare representative",
        "All parties must be present at signing"
      ],
      distribution: [
        "Give a copy to your healthcare representative",
        "Give a copy to your doctor",
        "Keep the original in a safe, accessible location"
      ]
    },

    commonPitfalls: [
      "Confusing Proxy Directive (names agent) with Instruction Directive (treatment wishes) — consider doing both",
      "Not realizing you need 2 witnesses OR notary (either/or)",
      "Forgetting to give a copy to your doctor",
      "Not discussing specific wishes with your representative"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/new-jersey",
        affiliateUrl: "https://mamabear.legal/new-jersey?ref=harbor",
        cost: "$89",
        features: [
          "Bundles Proxy Directive + Instruction Directive + HIPAA",
          "New Jersey-specific guidance",
          "Video notary included"
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

    estimatedCompletionTime: "30-45 minutes",

    notes: "NJ uses the term 'Proxy Directive' for naming an agent, and 'Instruction Directive' for treatment wishes. Short form (3-4 pages), relatively easy to complete."
  },

  VA: {
    state: "Virginia",
    stateCode: "VA",
    population: 8_631_393,
    formAvailability: "official",

    form: {
      title: "Advance Directive for Health Care",
      officialSourceUrl: "https://www.vdh.virginia.gov/emergency-medical-services/advance-directives/",
      lastVerified: "2025-01-15",
      version: "VA Code 54.1-2981",
      pageCount: 5
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be the person appointed as your agent",
        "Must be present when you sign the document"
      ],
      selfProving: false
    },

    terminology: "Advance Directive for Health Care",
    includesHIPAA: true,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/virginia/",

    reciprocity: {
      acceptsOtherStates: true,
      notes: "VA recognizes advance directives from other states"
    },

    instructions: {
      fillOut: [
        "Read through the entire form before beginning",
        "Part I: Appoint your healthcare agent",
        "Part II: State your healthcare wishes (living will provisions)",
        "Part III: Specify organ donation wishes (optional)",
        "Sign and date in front of 2 witnesses"
      ],
      witnesses: [
        "Must have 2 witnesses present when you sign",
        "Witnesses cannot be your appointed agent",
        "Notarization is recommended but not required"
      ],
      distribution: [
        "Give a copy to your healthcare agent",
        "Give a copy to your doctor",
        "Keep the original in a safe, accessible location",
        "Consider registering with the Virginia Advance Directive Registry"
      ]
    },

    commonPitfalls: [
      "Not realizing VA combines healthcare agent + living will into one document",
      "Skipping Part II (treatment wishes) — it's optional but valuable",
      "Forgetting to register with the VA Advance Directive Registry",
      "Not giving a copy to your physician"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/virginia",
        affiliateUrl: "https://mamabear.legal/virginia?ref=harbor",
        cost: "$89",
        features: [
          "Virginia-specific guidance",
          "Includes HIPAA authorization",
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

    estimatedCompletionTime: "30-60 minutes",

    notes: "VA combines healthcare agent appointment and living will into a single Advance Directive. Includes HIPAA authorization language. Relatively straightforward."
  },

  WA: {
    state: "Washington",
    stateCode: "WA",
    population: 7_614_893,
    formAvailability: "official",

    form: {
      title: "Durable Power of Attorney for Health Care",
      officialSourceUrl: "https://www.doh.wa.gov/YouandYourFamily/IllnessandDisease/AdvanceDirectives",
      lastVerified: "2025-01-15",
      version: "RCW 11.125",
      pageCount: 4
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your healthcare provider or their employee",
        "Cannot be the operator or employee of a care facility where you reside",
        "2 witnesses OR notary (either/or, not both required)"
      ],
      selfProving: false
    },

    terminology: "Durable Power of Attorney for Health Care",
    includesHIPAA: false,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/washington/",

    additionalForms: [
      {
        name: "Health Care Directive (Living Will)",
        description: "Separate document for specifying treatment preferences",
        recommended: true
      },
      {
        name: "HIPAA Authorization",
        description: "Separate authorization for medical record access",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "WA recognizes advance directives from other states"
    },

    instructions: {
      fillOut: [
        "Fill in your name and personal information",
        "Name your agent (attorney-in-fact) for healthcare",
        "Name a successor agent (recommended)",
        "Specify any limitations on your agent's authority",
        "Sign in front of 2 witnesses OR a notary"
      ],
      witnesses: [
        "You need 2 witnesses OR a notary (not both)",
        "Witnesses cannot be your healthcare provider or their employees",
        "Witnesses must be present when you sign"
      ],
      distribution: [
        "Give a copy to your agent",
        "Give a copy to your doctor",
        "Keep the original in an accessible location"
      ]
    },

    commonPitfalls: [
      "Confusing the either/or rule: 2 witnesses OR notary, not both required",
      "Not pairing with a Health Care Directive (Living Will) for treatment wishes",
      "Forgetting to give a copy to your physician",
      "Not discussing your wishes with your agent"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/washington",
        affiliateUrl: "https://mamabear.legal/washington?ref=harbor",
        cost: "$89",
        features: [
          "Washington-specific guidance",
          "Bundles POA + Living Will + HIPAA",
          "Video notary included"
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

    estimatedCompletionTime: "30-60 minutes",

    notes: "WA allows 2 witnesses OR notary (either/or). Short form (~4 pages). Consider pairing with a Health Care Directive for treatment wishes."
  },

  AZ: {
    state: "Arizona",
    stateCode: "AZ",
    population: 7_151_502,
    formAvailability: "official",

    form: {
      title: "Life Care Planning Document (Health Care Power of Attorney)",
      officialSourceUrl: "https://www.azag.gov/seniors/life-care-planning",
      lastVerified: "2025-01-15",
      version: "ARS 36-3221",
      pageCount: 18
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 1,
      witnessRestrictions: [
        "Cannot be your healthcare provider or their employee",
        "Cannot be the operator of a healthcare institution where you are receiving care",
        "1 witness OR notary (not both required)"
      ],
      selfProving: false
    },

    terminology: "Life Care Planning (Health Care Power of Attorney)",
    includesHIPAA: false,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/arizona/",

    additionalForms: [
      {
        name: "HIPAA Authorization",
        description: "Separate authorization for medical record access",
        recommended: true
      }
    ],

    reciprocity: {
      acceptsOtherStates: true,
      notes: "AZ recognizes advance directives from other states"
    },

    instructions: {
      fillOut: [
        "Download the comprehensive packet from the AZ Attorney General's office",
        "Read all instructions carefully (packet is 16-20 pages including instructions)",
        "Appoint your healthcare agent",
        "Specify your treatment preferences",
        "Include mental health care preferences (optional but unique to AZ)",
        "Sign in front of 1 witness OR a notary"
      ],
      witnesses: [
        "You need only 1 witness OR a notary (not both)",
        "Witness cannot be your healthcare provider or their employee",
        "Witness must be present when you sign"
      ],
      distribution: [
        "Give a copy to your agent",
        "Give a copy to your physician",
        "Keep the original in a safe, accessible place",
        "Consider informing your hospital if you have recurring visits"
      ]
    },

    commonPitfalls: [
      "Being overwhelmed by the 16-20 page packet — much of it is instructions, not form",
      "Not realizing you only need 1 witness OR notary (AZ is lenient on execution)",
      "Skipping the mental health care section (optional but valuable)",
      "Not separating the instruction pages from the actual form pages"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/arizona",
        affiliateUrl: "https://mamabear.legal/arizona?ref=harbor",
        cost: "$89",
        features: [
          "Simplifies the lengthy AZ packet",
          "Arizona-specific guidance",
          "Includes HIPAA authorization"
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

    estimatedCompletionTime: "45-90 minutes",

    notes: "AZ's comprehensive packet from the Attorney General's office is 16-20 pages but includes extensive instructions. Only 1 witness OR notary required, making execution easy despite the lengthy form."
  },

  MI: {
    state: "Michigan",
    stateCode: "MI",
    population: 10_077_331,
    formAvailability: "official",

    form: {
      title: "Patient Advocate Designation",
      officialSourceUrl: "https://www.michigan.gov/mdhhs/keep-mi-healthy/mentalhealth/patient-advocate",
      lastVerified: "2025-01-15",
      version: "MCL 700.5506",
      pageCount: 7
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your patient advocate (agent)",
        "Cannot be your healthcare provider or their employee",
        "Cannot be the operator or employee of a healthcare facility where you are a patient",
        "Cannot be an employee of your life or health insurance provider"
      ],
      selfProving: false
    },

    terminology: "Patient Advocate Designation",
    includesHIPAA: true,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/michigan/",

    reciprocity: {
      acceptsOtherStates: true,
      notes: "MI recognizes out-of-state advance directives"
    },

    instructions: {
      fillOut: [
        "Fill in your name and personal information",
        "Designate your patient advocate",
        "Designate a successor patient advocate (recommended)",
        "Specify the powers you are granting, including end-of-life decisions",
        "Include specific limitations if desired",
        "Sign in front of 2 witnesses"
      ],
      witnesses: [
        "Must have 2 witnesses present when you sign",
        "Witnesses must meet all restrictions listed above",
        "Witnesses must sign the document"
      ],
      distribution: [
        "Give a copy to your patient advocate",
        "Give a copy to your physician",
        "Keep the original in a safe, accessible location",
        "Inform family members about the document"
      ]
    },

    commonPitfalls: [
      "MI does NOT legally recognize living wills as binding — the Patient Advocate Designation is the primary document",
      "Not explicitly granting authority for end-of-life decisions (must be specifically stated)",
      "Insurance company employees cannot serve as witnesses",
      "Forgetting to discuss your wishes in detail with your patient advocate"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/michigan",
        affiliateUrl: "https://mamabear.legal/michigan?ref=harbor",
        cost: "$89",
        features: [
          "Michigan-specific guidance",
          "Handles unique MI terminology",
          "Includes HIPAA authorization"
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

    estimatedCompletionTime: "30-45 minutes",

    notes: "MI does NOT legally recognize living wills as binding documents. The Patient Advocate Designation is the primary and most important advance directive. Make sure to explicitly grant authority for end-of-life decisions."
  },

  TN: {
    state: "Tennessee",
    stateCode: "TN",
    population: 6_910_840,
    formAvailability: "official",

    form: {
      title: "Advance Directive for Health Care",
      officialSourceUrl: "https://www.tn.gov/health/health-program-areas/health-professional-boards/hcf-board/advance-directives.html",
      lastVerified: "2025-01-15",
      version: "TCA 68-11-1803",
      pageCount: 2
    },

    requirements: {
      notaryRequired: false,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be your designated agent",
        "2 witnesses OR notary (either/or, not both required)"
      ],
      selfProving: false
    },

    terminology: "Advance Directive for Health Care",
    includesHIPAA: true,

    caringInfoLandingUrl: "https://www.caringinfo.org/planning/advance-directives/by-state/tennessee/",

    reciprocity: {
      acceptsOtherStates: true,
      notes: "TN recognizes advance directives from other states"
    },

    instructions: {
      fillOut: [
        "Read the brief form (only 2 pages)",
        "Part 1: Appoint your healthcare agent",
        "Part 2: State your treatment preferences",
        "Sign in front of 2 witnesses OR a notary"
      ],
      witnesses: [
        "You need 2 witnesses OR a notary (not both)",
        "Witnesses cannot be your designated agent",
        "All parties must be present at signing"
      ],
      distribution: [
        "Give a copy to your agent",
        "Give a copy to your doctor",
        "Keep the original in an accessible location"
      ]
    },

    commonPitfalls: [
      "The form is very short (2 pages) — don't assume you're missing pages",
      "Not realizing 2 witnesses OR notary (either/or) is sufficient",
      "Skipping Part 2 (treatment preferences) because the form is so short",
      "Not giving a copy to your healthcare provider"
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/tennessee",
        affiliateUrl: "https://mamabear.legal/tennessee?ref=harbor",
        cost: "$89",
        features: [
          "Tennessee-specific guidance",
          "Includes HIPAA authorization",
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

    estimatedCompletionTime: "15-30 minutes",

    notes: "TN has one of the shortest and simplest advance directive forms in the country — just 2 pages. Includes HIPAA authorization. Great candidate for DIY completion."
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
