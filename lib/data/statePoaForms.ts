// State Power of Attorney Forms Database
// Top 16 states by population covering ~70% of US population
// Financial/Durable POA (not healthcare POA — that's in stateHealthcareProxyForms.ts)

import type { OnlineService } from "./stateHealthcareProxyForms";

export interface PoaFormInfo {
  state: string;
  stateCode: string;
  population: number;

  poaType: "durable" | "general" | "statutory";
  durabilityOptions: string[];
  scopeNotes: string;

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

  hostedPdfPath?: string;

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

export const STATE_POA_DATABASE: Record<string, PoaFormInfo> = {

  CA: {
    state: "California",
    stateCode: "CA",
    population: 39_538_223,
    poaType: "durable",
    durabilityOptions: ["Immediate (effective upon signing)", "Springing (effective upon incapacity)"],
    scopeNotes: "Covers all financial matters: bank accounts, real estate, investments, taxes, government benefits, business operations",
    formAvailability: "official",

    form: {
      title: "Uniform Statutory Form Power of Attorney",
      officialSourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=4401.&lawCode=PROB",
      lastVerified: "2025-01-15",
      version: "Prob. Code 4401",
      pageCount: 6,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 0,
      witnessRestrictions: [],
      selfProving: true,
    },

    terminology: "Uniform Statutory Form Power of Attorney",

    hostedPdfPath: "/forms/poa/CA.pdf",

    instructions: {
      fillOut: [
        "Download the California Uniform Statutory Form Power of Attorney",
        "Fill in principal's (your parent's) full legal name and address",
        "Name the agent (the person who will manage finances)",
        "Name a successor agent (backup)",
        "Initial the specific powers you want to grant (13 categories)",
        "Choose whether the POA is effective immediately or upon incapacity",
        "Sign in front of a notary public",
      ],
      witnesses: [
        "California requires notarization — witnesses are NOT sufficient alone",
        "Notary must witness the principal's signature",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give a copy to each financial institution (banks, brokerages)",
        "Give a copy to your parent's financial advisor",
        "Keep the original in a safe, accessible place",
        "Consider recording with the county recorder (optional but helpful for real estate)",
      ],
    },

    commonPitfalls: [
      "Must be notarized — a witnessed-only POA is not valid for financial matters in CA",
      "Banks may have their own POA forms they prefer — bring the statutory form AND ask about their requirements",
      "Some institutions require a POA less than 6 months old — consider timing",
      "Springing POA requires proof of incapacity, which can cause delays",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/california",
        affiliateUrl: "https://mamabear.legal/california?ref=harbor",
        cost: "$99",
        features: [
          "California-specific statutory form",
          "Video notary included",
          "Covers all 13 power categories",
          "1 year of free updates",
        ],
        rating: 4.8,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Attorney review available (+$199)",
          "Good customer support",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "45-90 minutes",

    notes: "CA requires notarization for financial POA. The statutory form includes 13 categories of powers — review each carefully with your parent. Banks may still want to see their own forms in addition.",
  },

  TX: {
    state: "Texas",
    stateCode: "TX",
    population: 29_145_505,
    poaType: "statutory",
    durabilityOptions: ["Durable (survives incapacity by default)", "Non-durable (terminates upon incapacity)"],
    scopeNotes: "Covers real property, banking, investments, insurance, estates/trusts, claims, personal property, taxes, government benefits",
    formAvailability: "official",

    form: {
      title: "Texas Statutory Durable Power of Attorney",
      officialSourceUrl: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.752.htm",
      lastVerified: "2025-01-15",
      version: "Estates Code Ch. 752",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 0,
      witnessRestrictions: [],
      selfProving: true,
    },

    terminology: "Statutory Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/TX.pdf",

    instructions: {
      fillOut: [
        "Download the Texas Statutory Durable Power of Attorney form",
        "Fill in principal's full legal name",
        "Name the attorney-in-fact (agent)",
        "Initial the specific powers you want to grant",
        "Add any special instructions or limitations",
        "Sign in front of a notary public",
      ],
      witnesses: [
        "Texas requires notarization for the statutory POA",
        "No witnesses required if notarized",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give a copy to banks and financial institutions",
        "Keep the original in a safe place",
        "Consider filing with county clerk (required for real estate transactions)",
      ],
    },

    commonPitfalls: [
      "TX POA is durable by default — it survives incapacity unless you specify otherwise",
      "Must be notarized — without notarization, financial institutions will reject it",
      "For real estate, the POA should be recorded with the county clerk",
      "Some banks require the POA to be presented within a certain time frame",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/texas",
        affiliateUrl: "https://mamabear.legal/texas?ref=harbor",
        cost: "$89",
        features: [
          "Texas statutory form",
          "Video notary included",
          "Covers all power categories",
        ],
        rating: 4.8,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Good customer support",
          "Attorney review available",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-60 minutes",

    notes: "TX's statutory form is durable by default. The form is relatively straightforward. Must be notarized. Record with county clerk if it will be used for real estate.",
  },

  FL: {
    state: "Florida",
    stateCode: "FL",
    population: 21_538_187,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Springing (effective upon incapacity)"],
    scopeNotes: "Covers real property, banking, stocks/bonds, business operations, insurance, estates, trusts, government benefits, taxes",
    formAvailability: "official",

    form: {
      title: "Florida Durable Power of Attorney",
      officialSourceUrl: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0709/0709.html",
      lastVerified: "2025-01-15",
      version: "FL Stat. Ch. 709",
      pageCount: 8,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Must be 18 or older",
        "Cannot be the agent named in the document",
      ],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/FL.pdf",

    instructions: {
      fillOut: [
        "Download the Florida Durable Power of Attorney form",
        "Fill in principal's full legal name and address",
        "Name the agent and any successor agents",
        "Specify the powers being granted",
        "Include durability language ('This power of attorney is not affected by subsequent incapacity')",
        "Sign in front of 2 witnesses AND a notary",
      ],
      witnesses: [
        "Florida requires BOTH 2 witnesses AND notarization",
        "Witnesses must be 18+ and cannot be the agent",
        "All parties must be present at signing",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give a copy to banks and financial institutions",
        "Give a copy to your parent's financial advisor if applicable",
        "Keep the original in a safe, accessible place",
      ],
    },

    commonPitfalls: [
      "FL requires BOTH witnesses AND notary — one or the other is not enough",
      "Must include specific durability language or it terminates upon incapacity",
      "FL reformed its POA law in 2011 — older forms may not be accepted",
      "Snowbirds: FL POA may not be recognized in other states without additional steps",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/florida",
        affiliateUrl: "https://mamabear.legal/florida?ref=harbor",
        cost: "$99",
        features: [
          "Florida-specific form with durability language",
          "Video notary included",
          "Snowbird package available (FL + northern state)",
        ],
        rating: 4.9,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Simple guided process",
          "Notary add-on available",
          "Good for straightforward situations",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "45-75 minutes",

    notes: "FL is strict: requires both witnesses AND notary. Must include durability language. Forms from before 2011 may be rejected. Consider online service to ensure compliance.",
  },

  NY: {
    state: "New York",
    stateCode: "NY",
    population: 20_201_249,
    poaType: "statutory",
    durabilityOptions: ["Durable (default — survives incapacity)", "Non-durable (must specify)"],
    scopeNotes: "Covers real estate, banking, insurance, retirement benefits, taxes, gifts, trusts, operating business interests",
    formAvailability: "official",

    form: {
      title: "New York Statutory Short Form Power of Attorney",
      officialSourceUrl: "https://www.health.ny.gov/forms/doh-5211.pdf",
      lastVerified: "2025-01-15",
      version: "GOL 5-1501B (Rev. 2021)",
      pageCount: 10,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Must be 18 or older",
        "Cannot be the agent",
      ],
      selfProving: false,
    },

    terminology: "Statutory Short Form Power of Attorney",

    hostedPdfPath: "/forms/poa/NY.pdf",

    instructions: {
      fillOut: [
        "Download the NY Statutory Short Form Power of Attorney",
        "Part 1: Principal designates agent and successor agent",
        "Part 2: Initial the powers you grant (14 categories listed)",
        "Part 3: Add modifications or supplements if needed",
        "Part 4: Sign in front of 2 witnesses AND a notary",
        "Agent must also sign and have their signature notarized (Statutory Gifts Rider if gifting powers included)",
      ],
      witnesses: [
        "NY requires BOTH 2 witnesses AND notarization",
        "Witnesses must be 18+ and cannot be the agent",
        "All parties must be present at signing",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to all financial institutions",
        "Keep the original in a safe location",
        "Agent should carry a copy",
      ],
    },

    commonPitfalls: [
      "NY revised its POA form in 2021 — older forms from before Sept 2021 may still be valid but institutions prefer the new form",
      "If granting gift-making authority, a separate Statutory Gifts Rider is required",
      "Agent must also sign and have signature notarized — not just the principal",
      "NY is strict about modifications — use exact statutory language",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/new-york",
        affiliateUrl: "https://mamabear.legal/new-york?ref=harbor",
        cost: "$99",
        features: [
          "Updated 2021 NY statutory form",
          "Includes Gifts Rider if needed",
          "Video notary included",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "NY-specific form",
          "Good customer support",
          "Attorney review available",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "60-90 minutes",

    notes: "NY's POA form was revised in 2021. Requires witnesses + notary. Agent must also sign and be notarized. If granting gifting powers, must complete the Statutory Gifts Rider. Consider professional help due to complexity.",
  },

  PA: {
    state: "Pennsylvania",
    stateCode: "PA",
    population: 13_002_700,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable (terminates upon incapacity)"],
    scopeNotes: "Covers real estate, banking, investments, insurance, retirement plans, taxes, government benefits, business operations",
    formAvailability: "official",

    form: {
      title: "Pennsylvania Power of Attorney",
      officialSourceUrl: "https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056..HTM",
      lastVerified: "2025-01-15",
      version: "20 Pa.C.S. Ch. 56",
      pageCount: 6,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be the agent",
        "Must be 18 or older",
      ],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/PA.pdf",

    instructions: {
      fillOut: [
        "Fill in principal's name and address",
        "Name the agent and successor agents",
        "Specify the powers to be granted",
        "Include durability language if you want it to survive incapacity",
        "Include notice to principal (required by PA law)",
        "Sign in front of 2 witnesses AND a notary",
      ],
      witnesses: [
        "PA requires 2 witnesses AND notarization",
        "Witnesses cannot be the agent",
        "All parties must be present at signing",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
      ],
    },

    commonPitfalls: [
      "Must include PA's required 'Notice' language — without it, the POA may be invalid",
      "Agent must sign an acknowledgment of their duties",
      "PA requires both witnesses AND notary",
      "Some PA banks have additional internal requirements",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/pennsylvania",
        affiliateUrl: "https://mamabear.legal/pennsylvania?ref=harbor",
        cost: "$89",
        features: [
          "PA-specific form with required notices",
          "Includes agent acknowledgment",
          "Video notary included",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Step-by-step guidance",
          "Customer support",
          "Notary available",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "45-60 minutes",

    notes: "PA requires a specific 'Notice' to the principal and an agent acknowledgment. Must have both witnesses and notary. The form is fairly standard once you include the required language.",
  },

  MA: {
    state: "Massachusetts",
    stateCode: "MA",
    population: 7_029_917,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable (default if durability not specified)"],
    scopeNotes: "Covers real estate, banking, investments, insurance, taxes, government benefits, personal property, business operations",
    formAvailability: "sample",

    form: {
      title: "Massachusetts Durable Power of Attorney",
      officialSourceUrl: "https://malegislature.gov/Laws/GeneralLaws/PartII/TitleII/Chapter201B",
      lastVerified: "2025-01-15",
      version: "MGL Ch. 201B",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 0,
      witnessRestrictions: [],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/MA.pdf",

    instructions: {
      fillOut: [
        "MA does not have a statutory short form — use a standard durable POA format",
        "Fill in principal's full legal name and address",
        "Name the agent and successor agent",
        "Specify the powers being granted",
        "Include durability language",
        "Sign in front of a notary public",
      ],
      witnesses: [
        "MA requires notarization only — no witness requirement",
        "Notary must witness the principal's signature",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
        "Consider recording at Registry of Deeds for real estate",
      ],
    },

    commonPitfalls: [
      "MA does not have a statutory short form — consider using an attorney or online service",
      "Must include specific durability language or it becomes void upon incapacity",
      "Some MA courts have been strict about POA language — professional drafting recommended",
      "For real estate, record with the Registry of Deeds",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/massachusetts",
        affiliateUrl: "https://mamabear.legal/massachusetts?ref=harbor",
        cost: "$99",
        features: [
          "MA-specific drafting",
          "Includes durability language",
          "Video notary included",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-60 minutes",

    notes: "MA does not have a statutory short form POA. Professional drafting is recommended. Must be notarized and include durability language. Record with Registry of Deeds for real estate matters.",
  },

  OH: {
    state: "Ohio",
    stateCode: "OH",
    population: 11_799_448,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable"],
    scopeNotes: "Covers real estate, banking, investments, insurance, taxes, government benefits, personal property",
    formAvailability: "official",

    form: {
      title: "Ohio Durable Power of Attorney",
      officialSourceUrl: "https://codes.ohio.gov/ohio-revised-code/chapter-1337",
      lastVerified: "2025-01-15",
      version: "ORC 1337.09",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 0,
      witnessRestrictions: [],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/OH.pdf",

    instructions: {
      fillOut: [
        "Fill in principal's name and address",
        "Name the agent (attorney-in-fact) and successor",
        "Specify the powers to be granted",
        "Include durability language",
        "Sign in front of a notary public",
      ],
      witnesses: [
        "Ohio requires notarization only — no witness requirement for financial POA",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to banks and financial institutions",
        "Keep the original in an accessible location",
      ],
    },

    commonPitfalls: [
      "Must include durability language for the POA to survive incapacity",
      "Notarization is required — without it, institutions will reject",
      "Real estate transactions require recording with the county recorder",
      "Some OH institutions have strict acceptance policies — present the POA early",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/ohio",
        affiliateUrl: "https://mamabear.legal/ohio?ref=harbor",
        cost: "$89",
        features: [
          "Ohio-specific POA",
          "Video notary included",
          "Covers all financial powers",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "OH requires notarization. Include durability language. Straightforward form — notary only, no witnesses needed.",
  },

  IL: {
    state: "Illinois",
    stateCode: "IL",
    population: 12_812_508,
    poaType: "statutory",
    durabilityOptions: ["Durable (default under statutory form)", "Non-durable (must specify)"],
    scopeNotes: "Covers real estate, banking, investments, insurance, taxes, government benefits, personal property, digital assets",
    formAvailability: "official",

    form: {
      title: "Illinois Statutory Short Form Power of Attorney for Property",
      officialSourceUrl: "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2113&ChapterID=60",
      lastVerified: "2025-01-15",
      version: "755 ILCS 45/3-3",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 1,
      witnessRestrictions: [
        "Cannot be the agent",
      ],
      selfProving: false,
    },

    terminology: "Statutory Short Form Power of Attorney for Property",

    hostedPdfPath: "/forms/poa/IL.pdf",

    instructions: {
      fillOut: [
        "Download the Illinois Statutory Short Form",
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Check the powers you want to grant",
        "Sign in front of 1 witness AND a notary",
      ],
      witnesses: [
        "Illinois requires 1 witness AND notarization",
        "Witness cannot be the agent",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe, accessible place",
      ],
    },

    commonPitfalls: [
      "IL has separate forms for property (financial) and healthcare — make sure you use the property form",
      "Requires both a witness AND notary",
      "The statutory short form is durable by default",
      "Agent has a duty to keep records — inform them of this responsibility",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/illinois",
        affiliateUrl: "https://mamabear.legal/illinois?ref=harbor",
        cost: "$89",
        features: [
          "Illinois statutory form",
          "Video notary included",
          "Covers property POA",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "IL separates healthcare and property POA. This covers financial/property only. Requires 1 witness + notary. The statutory form is durable by default.",
  },

  GA: {
    state: "Georgia",
    stateCode: "GA",
    population: 10_711_908,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable"],
    scopeNotes: "Covers real estate, banking, investments, insurance, taxes, government benefits, personal property, business operations",
    formAvailability: "official",

    form: {
      title: "Georgia Financial Power of Attorney",
      officialSourceUrl: "https://law.justia.com/codes/georgia/title-10/chapter-6b/",
      lastVerified: "2025-01-15",
      version: "GA Code Title 10, Ch. 6B",
      pageCount: 7,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 1,
      witnessRestrictions: [
        "Cannot be the agent",
        "Must be 18 or older",
      ],
      selfProving: false,
    },

    terminology: "Financial Power of Attorney",

    hostedPdfPath: "/forms/poa/GA.pdf",

    instructions: {
      fillOut: [
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Specify the powers to be granted",
        "Include durability language",
        "Sign in front of 1 witness AND a notary",
      ],
      witnesses: [
        "Georgia requires 1 witness AND notarization",
        "Witness cannot be the agent and must be 18+",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
      ],
    },

    commonPitfalls: [
      "Must include durability language for it to survive incapacity",
      "GA requires both a witness and notary",
      "Updated law (2017) provides more protections — use current forms",
      "For real estate, record with the county clerk of superior court",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/georgia",
        affiliateUrl: "https://mamabear.legal/georgia?ref=harbor",
        cost: "$89",
        features: [
          "Georgia-specific form",
          "Video notary included",
          "Updated to current law",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-60 minutes",

    notes: "GA updated its POA law in 2017 with additional protections. Requires 1 witness + notary. Include durability language.",
  },

  NC: {
    state: "North Carolina",
    stateCode: "NC",
    population: 10_439_388,
    poaType: "statutory",
    durabilityOptions: ["Durable (default under statutory form)", "Non-durable (must specify)"],
    scopeNotes: "Covers real property, personal property, banking, investments, insurance, taxes, government benefits, business operations",
    formAvailability: "official",

    form: {
      title: "North Carolina Statutory Short Form Power of Attorney",
      officialSourceUrl: "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_32C.html",
      lastVerified: "2025-01-15",
      version: "NCGS Ch. 32C",
      pageCount: 6,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 0,
      witnessRestrictions: [],
      selfProving: true,
    },

    terminology: "Statutory Short Form Power of Attorney",

    hostedPdfPath: "/forms/poa/NC.pdf",

    instructions: {
      fillOut: [
        "Download the NC Statutory Short Form",
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Initial the powers you want to grant",
        "Sign in front of a notary public",
      ],
      witnesses: [
        "NC financial POA requires notarization only",
        "No witnesses required (unlike NC healthcare POA which requires both)",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Record with Register of Deeds for real estate",
        "Keep the original in a safe place",
      ],
    },

    commonPitfalls: [
      "NC financial POA is simpler than healthcare POA — notary only, no witnesses needed",
      "Don't confuse requirements with healthcare POA (which needs witnesses + notary)",
      "For real estate, recording with Register of Deeds is strongly recommended",
      "The statutory form is durable by default",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/north-carolina",
        affiliateUrl: "https://mamabear.legal/north-carolina?ref=harbor",
        cost: "$89",
        features: [
          "NC statutory form",
          "Video notary included",
          "Covers all power categories",
        ],
        rating: 4.8,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "NC financial POA is straightforward — notary only, no witnesses required. Durable by default. Record with Register of Deeds for real estate matters.",
  },

  NJ: {
    state: "New Jersey",
    stateCode: "NJ",
    population: 9_288_994,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable"],
    scopeNotes: "Covers real estate, banking, investments, insurance, taxes, government benefits, personal property",
    formAvailability: "sample",

    form: {
      title: "New Jersey Durable Power of Attorney",
      officialSourceUrl: "https://lis.njleg.state.nj.us/nxt/gateway.dll?f=templates&fn=default.htm&vid=Publish:10.1048/Enu",
      lastVerified: "2025-01-15",
      version: "NJSA 46:2B-8.1 et seq.",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be the agent",
        "Must be 18 or older",
      ],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/NJ.pdf",

    instructions: {
      fillOut: [
        "NJ does not have a statutory short form — use a standard durable POA format",
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Specify the powers being granted",
        "Include durability language",
        "Sign in front of 2 witnesses AND a notary",
      ],
      witnesses: [
        "NJ requires 2 witnesses AND notarization",
        "Witnesses cannot be the agent and must be 18+",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
      ],
    },

    commonPitfalls: [
      "NJ does not have a statutory form — professional drafting recommended",
      "Requires both witnesses AND notary",
      "Must include durability language",
      "Some NJ institutions are strict about acceptance — present the POA early",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/new-jersey",
        affiliateUrl: "https://mamabear.legal/new-jersey?ref=harbor",
        cost: "$99",
        features: [
          "NJ-specific drafting",
          "Video notary included",
          "Includes durability language",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "45-60 minutes",

    notes: "NJ does not have a statutory short form for financial POA. Professional drafting is recommended. Requires witnesses + notary.",
  },

  VA: {
    state: "Virginia",
    stateCode: "VA",
    population: 8_631_393,
    poaType: "durable",
    durabilityOptions: ["Durable (default under UPOAA)", "Non-durable (must specify)"],
    scopeNotes: "Covers real property, banking, investments, insurance, taxes, government benefits, business operations, digital assets",
    formAvailability: "official",

    form: {
      title: "Virginia Uniform Power of Attorney",
      officialSourceUrl: "https://law.lis.virginia.gov/vacode/title64.2/chapter16/",
      lastVerified: "2025-01-15",
      version: "VA Code Title 64.2 Ch. 16",
      pageCount: 6,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 0,
      witnessRestrictions: [],
      selfProving: true,
    },

    terminology: "Uniform Power of Attorney",

    hostedPdfPath: "/forms/poa/VA.pdf",

    instructions: {
      fillOut: [
        "Use the Virginia Uniform Power of Attorney form",
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Specify the powers to be granted",
        "Sign in front of a notary public",
      ],
      witnesses: [
        "Virginia requires notarization only — no witnesses needed",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
        "Consider recording with the circuit court clerk for real estate",
      ],
    },

    commonPitfalls: [
      "VA adopted the Uniform Power of Attorney Act — POA is durable by default",
      "Notarization required — witnesses alone are not sufficient",
      "Financial institutions must accept the POA within a reasonable time (VA law provides penalties for unreasonable refusal)",
      "For real estate, record with the circuit court clerk",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/virginia",
        affiliateUrl: "https://mamabear.legal/virginia?ref=harbor",
        cost: "$89",
        features: [
          "Virginia UPOAA-compliant form",
          "Video notary included",
          "Step-by-step guidance",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "VA adopted the Uniform Power of Attorney Act. POA is durable by default, and institutions face penalties for unreasonable refusal. Notary only — no witnesses needed.",
  },

  WA: {
    state: "Washington",
    stateCode: "WA",
    population: 7_614_893,
    poaType: "durable",
    durabilityOptions: ["Durable (default under UPOAA)", "Non-durable (must specify)"],
    scopeNotes: "Covers real property, banking, investments, insurance, taxes, government benefits, personal property, digital assets",
    formAvailability: "official",

    form: {
      title: "Washington Uniform Power of Attorney",
      officialSourceUrl: "https://app.leg.wa.gov/RCW/default.aspx?cite=11.125",
      lastVerified: "2025-01-15",
      version: "RCW 11.125",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 0,
      witnessRestrictions: [],
      selfProving: true,
    },

    terminology: "Uniform Power of Attorney",

    hostedPdfPath: "/forms/poa/WA.pdf",

    instructions: {
      fillOut: [
        "Use the Washington Uniform Power of Attorney form",
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Specify the powers to be granted",
        "Sign in front of a notary public",
      ],
      witnesses: [
        "Washington requires notarization only — no witnesses needed",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
      ],
    },

    commonPitfalls: [
      "WA adopted the Uniform Power of Attorney Act — POA is durable by default",
      "Notarization required",
      "Institutions must accept within a reasonable time under WA law",
      "For real estate, record with the county auditor",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/washington",
        affiliateUrl: "https://mamabear.legal/washington?ref=harbor",
        cost: "$89",
        features: [
          "WA UPOAA-compliant form",
          "Video notary included",
          "Step-by-step guidance",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "WA adopted the Uniform Power of Attorney Act. Durable by default. Notary only. Institutions face penalties for unreasonable refusal.",
  },

  AZ: {
    state: "Arizona",
    stateCode: "AZ",
    population: 7_151_502,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable"],
    scopeNotes: "Covers real property, banking, investments, insurance, taxes, government benefits, personal property",
    formAvailability: "official",

    form: {
      title: "Arizona Durable Power of Attorney",
      officialSourceUrl: "https://www.azleg.gov/arsDetail/?title=14&chapter=5&article=5",
      lastVerified: "2025-01-15",
      version: "ARS Title 14, Ch. 5",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 1,
      witnessRestrictions: [
        "Cannot be the agent",
      ],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/AZ.pdf",

    instructions: {
      fillOut: [
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Specify the powers being granted",
        "Include durability language",
        "Sign in front of 1 witness AND a notary",
      ],
      witnesses: [
        "Arizona requires 1 witness AND notarization",
        "Witness cannot be the agent",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
        "Record with county recorder for real estate",
      ],
    },

    commonPitfalls: [
      "Must include durability language for it to survive incapacity",
      "Requires both a witness and notary",
      "For real estate transactions, record with the county recorder",
      "AZ allows mental health provisions in the POA — consider including",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/arizona",
        affiliateUrl: "https://mamabear.legal/arizona?ref=harbor",
        cost: "$89",
        features: [
          "Arizona-specific form",
          "Video notary included",
          "Covers financial powers",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "AZ requires 1 witness + notary. Include durability language. Record with county recorder for real estate.",
  },

  MI: {
    state: "Michigan",
    stateCode: "MI",
    population: 10_077_331,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable"],
    scopeNotes: "Covers real property, banking, investments, insurance, taxes, government benefits, personal property",
    formAvailability: "official",

    form: {
      title: "Michigan Durable Power of Attorney",
      officialSourceUrl: "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-700-5501",
      lastVerified: "2025-01-15",
      version: "MCL 700.5501",
      pageCount: 5,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be the agent",
        "Must be 18 or older",
      ],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/MI.pdf",

    instructions: {
      fillOut: [
        "Fill in principal's name and address",
        "Name the agent and successor agent",
        "Specify the powers being granted",
        "Include durability language",
        "Sign in front of 2 witnesses AND a notary",
      ],
      witnesses: [
        "Michigan requires 2 witnesses AND notarization",
        "Witnesses cannot be the agent and must be 18+",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
      ],
    },

    commonPitfalls: [
      "Must include durability language",
      "Requires both witnesses AND notary",
      "MI separates financial POA from patient advocate designation (healthcare) — don't confuse the two",
      "Agent has a fiduciary duty — make sure they understand their responsibilities",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/michigan",
        affiliateUrl: "https://mamabear.legal/michigan?ref=harbor",
        cost: "$89",
        features: [
          "Michigan-specific form",
          "Video notary included",
          "Covers financial powers",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "MI requires witnesses + notary. Include durability language. MI separates financial POA from healthcare (Patient Advocate Designation).",
  },

  TN: {
    state: "Tennessee",
    stateCode: "TN",
    population: 6_910_840,
    poaType: "durable",
    durabilityOptions: ["Durable (must include durability language)", "Non-durable"],
    scopeNotes: "Covers real property, banking, investments, insurance, taxes, government benefits, personal property",
    formAvailability: "official",

    form: {
      title: "Tennessee Durable Power of Attorney",
      officialSourceUrl: "https://www.tn.gov/health/cedep/environmental/power-of-attorney.html",
      lastVerified: "2025-01-15",
      version: "TCA 34-6-101",
      pageCount: 4,
    },

    requirements: {
      notaryRequired: true,
      notaryRecommended: true,
      witnessCount: 2,
      witnessRestrictions: [
        "Cannot be the agent",
      ],
      selfProving: false,
    },

    terminology: "Durable Power of Attorney",

    hostedPdfPath: "/forms/poa/TN.pdf",

    instructions: {
      fillOut: [
        "Fill in principal's name and address",
        "Name the agent (attorney-in-fact) and successor",
        "Specify the powers being granted",
        "Include durability language",
        "Sign in front of 2 witnesses AND a notary",
      ],
      witnesses: [
        "Tennessee requires 2 witnesses AND notarization",
        "Witnesses cannot be the agent",
      ],
      distribution: [
        "Give a copy to the agent",
        "Give copies to financial institutions",
        "Keep the original in a safe place",
        "Record with the county register for real estate",
      ],
    },

    commonPitfalls: [
      "Must include durability language for it to survive incapacity",
      "Requires both witnesses AND notary",
      "For real estate, recording with county register is essential",
      "TN law provides that financial institutions can be liable for wrongful rejection of a valid POA",
    ],

    onlineServiceRecommendations: [
      {
        name: "Mama Bear Legal",
        url: "https://mamabear.legal/tennessee",
        affiliateUrl: "https://mamabear.legal/tennessee?ref=harbor",
        cost: "$89",
        features: [
          "Tennessee-specific form",
          "Video notary included",
          "Covers financial powers",
        ],
        rating: 4.7,
        stateSpecific: true,
      },
      {
        name: "LegalZoom",
        url: "https://legalzoom.com/power-of-attorney",
        cost: "$89 + $49 notary",
        features: [
          "Well-known service",
          "Customer support",
          "Quick turnaround",
        ],
        rating: 4.5,
        stateSpecific: true,
      },
    ],

    estimatedCompletionTime: "30-45 minutes",

    notes: "TN requires witnesses + notary. Include durability language. Short form (~4 pages). Financial institutions face penalties for wrongful rejection.",
  },
};

// Helper functions
export function getPoaFormInfo(stateCode: string): PoaFormInfo | null {
  return STATE_POA_DATABASE[stateCode.toUpperCase()] || null;
}

export function getPoaSupportedStates(): string[] {
  return Object.keys(STATE_POA_DATABASE);
}

export function isPoaStateSupported(stateCode: string): boolean {
  return stateCode.toUpperCase() in STATE_POA_DATABASE;
}

export function getPoaFormComplexity(stateCode: string): "easy" | "moderate" | "complex" | null {
  const info = getPoaFormInfo(stateCode);
  if (!info) return null;

  const hasNotary = info.requirements.notaryRequired;
  const hasWitnesses = info.requirements.witnessCount > 0;
  const pageCount = info.form?.pageCount || 0;

  if (hasNotary && hasWitnesses && pageCount > 6) {
    return "complex";
  } else if (hasNotary && hasWitnesses) {
    return "moderate";
  } else {
    return "easy";
  }
}

export function getPoaRecommendedApproach(
  stateCode: string,
  familyComplexity: "simple" | "moderate" | "complex" = "simple"
): "state_form" | "online_service" | "attorney" {
  const info = getPoaFormInfo(stateCode);
  if (!info) return "online_service";

  if (familyComplexity === "complex") {
    return "attorney";
  }

  const formComplexity = getPoaFormComplexity(stateCode);

  if (formComplexity === "easy" && familyComplexity === "simple" && info.formAvailability === "official") {
    return "state_form";
  }

  return "online_service";
}
