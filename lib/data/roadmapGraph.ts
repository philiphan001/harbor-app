// Network graph data for the Care Roadmap
// 138 decision nodes across 6 domains

export interface NodeData {
  id: string;
  name: string;
  domain: string;
  domainColor: string;
  description?: string;
  val?: number; // node size
}

export interface LinkData {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

// Domain definitions
const domains = {
  medical: { name: "Medical", color: "#D4725C", icon: "♥" },
  financial: { name: "Financial", color: "#1B6B7D", icon: "◈" },
  legal: { name: "Legal", color: "#6B8F71", icon: "◉" },
  housing: { name: "Housing & Safety", color: "#C4943A", icon: "⌂" },
  family: { name: "Family Dynamics", color: "#4A6274", icon: "◎" },
  caregiving: { name: "Caregiving", color: "#2A8FA4", icon: "▣" },
};

// All 138 decision nodes
const nodes: NodeData[] = [
  // MEDICAL DOMAIN - 24 nodes
  { id: "med-1", name: "Primary Care Provider Selection", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-2", name: "Specialist Coordination", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-3", name: "Medication Management", domain: "medical", domainColor: domains.medical.color, val: 4 },
  { id: "med-4", name: "Medication Interactions", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-5", name: "Treatment Protocol Decisions", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-6", name: "Cognitive Assessment", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-7", name: "Memory Monitoring", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-8", name: "Surgery Decisions", domain: "medical", domainColor: domains.medical.color, val: 4 },
  { id: "med-9", name: "Post-Surgery Recovery Planning", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-10", name: "Emergency Protocols", domain: "medical", domainColor: domains.medical.color, val: 4 },
  { id: "med-11", name: "Advance Directives", domain: "medical", domainColor: domains.medical.color, val: 4 },
  { id: "med-12", name: "Hospital Discharge Planning", domain: "medical", domainColor: domains.medical.color, val: 4 },
  { id: "med-13", name: "Rehabilitation Services", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-14", name: "Physical Therapy", domain: "medical", domainColor: domains.medical.color, val: 2 },
  { id: "med-15", name: "Occupational Therapy", domain: "medical", domainColor: domains.medical.color, val: 2 },
  { id: "med-16", name: "Diagnostic Testing", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-17", name: "Medical Equipment Needs", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-18", name: "Pain Management", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-19", name: "Palliative Care Considerations", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-20", name: "Mental Health Support", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-21", name: "Nutrition and Diet Management", domain: "medical", domainColor: domains.medical.color, val: 2 },
  { id: "med-22", name: "Fall Risk Assessment", domain: "medical", domainColor: domains.medical.color, val: 3 },
  { id: "med-23", name: "Chronic Disease Management", domain: "medical", domainColor: domains.medical.color, val: 4 },
  { id: "med-24", name: "Preventive Care Scheduling", domain: "medical", domainColor: domains.medical.color, val: 2 },

  // FINANCIAL DOMAIN - 32 nodes
  { id: "fin-1", name: "Medicare Part A Coverage", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-2", name: "Medicare Part B Coverage", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-3", name: "Medicare Part C (Advantage)", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-4", name: "Medicare Part D (Prescriptions)", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-5", name: "Medigap Policy Selection", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-6", name: "Medicare vs Advantage Trade-offs", domain: "financial", domainColor: domains.financial.color, val: 5 },
  { id: "fin-7", name: "Long-Term Care Insurance", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-8", name: "LTC Policy Activation", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-9", name: "Medicaid Eligibility", domain: "financial", domainColor: domains.financial.color, val: 5 },
  { id: "fin-10", name: "Medicaid Spend-Down Strategy", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-11", name: "Asset Protection Planning", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-12", name: "Home Equity Considerations", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-13", name: "Reverse Mortgage Options", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-14", name: "Monthly Cost Projections", domain: "financial", domainColor: domains.financial.color, val: 5 },
  { id: "fin-15", name: "3-Year Financial Planning", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-16", name: "10-Year Financial Modeling", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-17", name: "Insurance Claims Management", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-18", name: "Medical Bill Review", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-19", name: "EOB Reconciliation", domain: "financial", domainColor: domains.financial.color, val: 2 },
  { id: "fin-20", name: "Tax Implications of Caregiving", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-21", name: "Dependent Care Credits", domain: "financial", domainColor: domains.financial.color, val: 2 },
  { id: "fin-22", name: "Medical Expense Deductions", domain: "financial", domainColor: domains.financial.color, val: 2 },
  { id: "fin-23", name: "Retirement Account Impacts", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-24", name: "Social Security Optimization", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-25", name: "Pension Management", domain: "financial", domainColor: domains.financial.color, val: 2 },
  { id: "fin-26", name: "Investment Portfolio Adjustments", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-27", name: "Life Insurance Policies", domain: "financial", domainColor: domains.financial.color, val: 2 },
  { id: "fin-28", name: "Veterans Benefits", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-29", name: "Aid & Attendance Benefits", domain: "financial", domainColor: domains.financial.color, val: 3 },
  { id: "fin-30", name: "Facility Cost Analysis", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-31", name: "In-Home Care Budgeting", domain: "financial", domainColor: domains.financial.color, val: 4 },
  { id: "fin-32", name: "Emergency Financial Reserves", domain: "financial", domainColor: domains.financial.color, val: 3 },

  // LEGAL DOMAIN - 18 nodes
  { id: "leg-1", name: "Healthcare Proxy", domain: "legal", domainColor: domains.legal.color, val: 5 },
  { id: "leg-2", name: "Financial Power of Attorney", domain: "legal", domainColor: domains.legal.color, val: 5 },
  { id: "leg-3", name: "Medical Power of Attorney", domain: "legal", domainColor: domains.legal.color, val: 5 },
  { id: "leg-4", name: "Will Review and Updates", domain: "legal", domainColor: domains.legal.color, val: 4 },
  { id: "leg-5", name: "Trust Structure Setup", domain: "legal", domainColor: domains.legal.color, val: 4 },
  { id: "leg-6", name: "Revocable Living Trust", domain: "legal", domainColor: domains.legal.color, val: 3 },
  { id: "leg-7", name: "Irrevocable Trust Options", domain: "legal", domainColor: domains.legal.color, val: 3 },
  { id: "leg-8", name: "Beneficiary Designations", domain: "legal", domainColor: domains.legal.color, val: 3 },
  { id: "leg-9", name: "Guardianship Considerations", domain: "legal", domainColor: domains.legal.color, val: 4 },
  { id: "leg-10", name: "Conservatorship Proceedings", domain: "legal", domainColor: domains.legal.color, val: 3 },
  { id: "leg-11", name: "DNR Orders", domain: "legal", domainColor: domains.legal.color, val: 4 },
  { id: "leg-12", name: "Living Will", domain: "legal", domainColor: domains.legal.color, val: 4 },
  { id: "leg-13", name: "HIPAA Authorizations", domain: "legal", domainColor: domains.legal.color, val: 4 },
  { id: "leg-14", name: "POLST Forms", domain: "legal", domainColor: domains.legal.color, val: 3 },
  { id: "leg-15", name: "Estate Tax Planning", domain: "legal", domainColor: domains.legal.color, val: 3 },
  { id: "leg-16", name: "Property Title Review", domain: "legal", domainColor: domains.legal.color, val: 2 },
  { id: "leg-17", name: "Medicaid Trust Planning", domain: "legal", domainColor: domains.legal.color, val: 4 },
  { id: "leg-18", name: "Elder Law Attorney Selection", domain: "legal", domainColor: domains.legal.color, val: 3 },

  // HOUSING & SAFETY DOMAIN - 21 nodes
  { id: "hou-1", name: "Home Safety Assessment", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-2", name: "Fall Prevention Modifications", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-3", name: "Bathroom Safety Upgrades", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-4", name: "Accessibility Modifications", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-5", name: "Age-in-Place Feasibility", domain: "housing", domainColor: domains.housing.color, val: 5 },
  { id: "hou-6", name: "Home Modification Costs", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-7", name: "Assisted Living Options", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-8", name: "Independent Living Communities", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-9", name: "Memory Care Facilities", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-10", name: "Skilled Nursing Facilities", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-11", name: "Continuing Care Communities", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-12", name: "Facility Tours and Evaluation", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-13", name: "Facility Cost Comparison", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-14", name: "Waitlist Management", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-15", name: "Home Sale Timing", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-16", name: "Home Sale Proceeds Planning", domain: "housing", domainColor: domains.housing.color, val: 4 },
  { id: "hou-17", name: "Moving Logistics", domain: "housing", domainColor: domains.housing.color, val: 2 },
  { id: "hou-18", name: "Downsizing Strategy", domain: "housing", domainColor: domains.housing.color, val: 3 },
  { id: "hou-19", name: "Emergency Alert Systems", domain: "housing", domainColor: domains.housing.color, val: 2 },
  { id: "hou-20", name: "Smart Home Technology", domain: "housing", domainColor: domains.housing.color, val: 2 },
  { id: "hou-21", name: "Environmental Safety (lighting, etc)", domain: "housing", domainColor: domains.housing.color, val: 2 },

  // FAMILY DYNAMICS DOMAIN - 15 nodes
  { id: "fam-1", name: "Role Allocation Among Siblings", domain: "family", domainColor: domains.family.color, val: 5 },
  { id: "fam-2", name: "Primary Caregiver Designation", domain: "family", domainColor: domains.family.color, val: 5 },
  { id: "fam-3", name: "Cost-Sharing Agreements", domain: "family", domainColor: domains.family.color, val: 4 },
  { id: "fam-4", name: "Communication Protocols", domain: "family", domainColor: domains.family.color, val: 4 },
  { id: "fam-5", name: "Family Meeting Cadence", domain: "family", domainColor: domains.family.color, val: 3 },
  { id: "fam-6", name: "Conflict Resolution Process", domain: "family", domainColor: domains.family.color, val: 4 },
  { id: "fam-7", name: "Geographic Constraints", domain: "family", domainColor: domains.family.color, val: 4 },
  { id: "fam-8", name: "Career Impact Assessment", domain: "family", domainColor: domains.family.color, val: 4 },
  { id: "fam-9", name: "Work-Life Balance", domain: "family", domainColor: domains.family.color, val: 3 },
  { id: "fam-10", name: "Sibling Power Dynamics", domain: "family", domainColor: domains.family.color, val: 4 },
  { id: "fam-11", name: "Parent Preferences", domain: "family", domainColor: domains.family.color, val: 4 },
  { id: "fam-12", name: "Spousal Coordination", domain: "family", domainColor: domains.family.color, val: 3 },
  { id: "fam-13", name: "Extended Family Involvement", domain: "family", domainColor: domains.family.color, val: 2 },
  { id: "fam-14", name: "Emotional Support Needs", domain: "family", domainColor: domains.family.color, val: 3 },
  { id: "fam-15", name: "Caregiver Burnout Prevention", domain: "family", domainColor: domains.family.color, val: 4 },

  // CAREGIVING LOGISTICS DOMAIN - 28 nodes
  { id: "car-1", name: "Home Health Aide Sourcing", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-2", name: "Caregiver Vetting Process", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-3", name: "Background Checks", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-4", name: "Agency vs Independent Caregivers", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-5", name: "Scheduling and Shift Coverage", domain: "caregiving", domainColor: domains.caregiving.color, val: 5 },
  { id: "car-6", name: "24/7 Care Coordination", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-7", name: "Caregiver Turnover Management", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-8", name: "Backup Care Plans", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-9", name: "Respite Care Planning", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-10", name: "Respite Care Funding", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-11", name: "Medical Equipment Procurement", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-12", name: "DME Insurance Coverage", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-13", name: "Medical Supplies Management", domain: "caregiving", domainColor: domains.caregiving.color, val: 2 },
  { id: "car-14", name: "Transportation Coordination", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-15", name: "Medical Appointment Transport", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-16", name: "Non-Medical Transport", domain: "caregiving", domainColor: domains.caregiving.color, val: 2 },
  { id: "car-17", name: "Adult Day Programs", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-18", name: "Day Program Selection", domain: "caregiving", domainColor: domains.caregiving.color, val: 2 },
  { id: "car-19", name: "Emergency Backup Plans", domain: "caregiving", domainColor: domains.caregiving.color, val: 5 },
  { id: "car-20", name: "Hospital Visit Coordination", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-21", name: "Care Task Documentation", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-22", name: "Medication Administration", domain: "caregiving", domainColor: domains.caregiving.color, val: 4 },
  { id: "car-23", name: "Personal Care Assistance", domain: "caregiving", domainColor: domains.caregiving.color, val: 3 },
  { id: "car-24", name: "Meal Preparation", domain: "caregiving", domainColor: domains.caregiving.color, val: 2 },
  { id: "car-25", name: "Housekeeping Coordination", domain: "caregiving", domainColor: domains.caregiving.color, val: 2 },
  { id: "car-26", name: "Laundry Services", domain: "caregiving", domainColor: domains.caregiving.color, val: 1 },
  { id: "car-27", name: "Companion Care", domain: "caregiving", domainColor: domains.caregiving.color, val: 2 },
  { id: "car-28", name: "Technology Training for Caregivers", domain: "caregiving", domainColor: domains.caregiving.color, val: 2 },
];

// Define connections between nodes (creates the "web")
// Each domain connects to related domains as specified in the roadmap
const links: LinkData[] = [
  // Medical → Financial connections
  { source: "med-3", target: "fin-4" }, // Medications → Part D
  { source: "med-8", target: "fin-1" }, // Surgery → Medicare A
  { source: "med-12", target: "fin-1" }, // Hospital discharge → Medicare A
  { source: "med-17", target: "fin-17" }, // Medical equipment → Claims
  { source: "med-23", target: "fin-14" }, // Chronic disease → Cost projections

  // Medical → Legal connections
  { source: "med-10", target: "leg-1" }, // Emergency protocols → Healthcare proxy
  { source: "med-11", target: "leg-11" }, // Advance directives → DNR
  { source: "med-11", target: "leg-12" }, // Advance directives → Living will
  { source: "med-19", target: "leg-14" }, // Palliative care → POLST

  // Medical → Caregiving connections
  { source: "med-3", target: "car-22" }, // Medications → Med administration
  { source: "med-17", target: "car-11" }, // Medical equipment → Equipment procurement
  { source: "med-14", target: "car-15" }, // PT → Medical transport
  { source: "med-13", target: "car-20" }, // Rehab → Hospital coordination

  // Financial → Legal connections
  { source: "fin-9", target: "leg-17" }, // Medicaid eligibility → Medicaid trust
  { source: "fin-10", target: "leg-5" }, // Spend-down → Trust structure
  { source: "fin-11", target: "leg-6" }, // Asset protection → Revocable trust
  { source: "fin-11", target: "leg-7" }, // Asset protection → Irrevocable trust
  { source: "fin-12", target: "leg-16" }, // Home equity → Property title

  // Financial → Housing connections
  { source: "fin-14", target: "hou-5" }, // Cost projections → Age-in-place
  { source: "fin-30", target: "hou-13" }, // Facility costs → Cost comparison
  { source: "fin-31", target: "hou-6" }, // In-home budget → Modification costs
  { source: "fin-12", target: "hou-15" }, // Home equity → Home sale timing
  { source: "fin-13", target: "hou-5" }, // Reverse mortgage → Age-in-place

  // Financial → Medical connections
  { source: "fin-4", target: "med-3" }, // Part D → Medications
  { source: "fin-7", target: "med-19" }, // LTC insurance → Palliative care
  { source: "fin-17", target: "med-17" }, // Claims → Medical equipment

  // Legal → Family connections
  { source: "leg-1", target: "fam-1" }, // Healthcare proxy → Role allocation
  { source: "leg-2", target: "fam-1" }, // Financial POA → Role allocation
  { source: "leg-9", target: "fam-6" }, // Guardianship → Conflict resolution

  // Legal → Medical connections
  { source: "leg-1", target: "med-10" }, // Healthcare proxy → Emergency protocols
  { source: "leg-11", target: "med-11" }, // DNR → Advance directives
  { source: "leg-13", target: "med-2" }, // HIPAA → Specialist coordination

  // Legal → Financial connections
  { source: "leg-5", target: "fin-11" }, // Trust → Asset protection
  { source: "leg-17", target: "fin-9" }, // Medicaid trust → Medicaid eligibility

  // Housing → Financial connections
  { source: "hou-5", target: "fin-14" }, // Age-in-place → Cost projections
  { source: "hou-13", target: "fin-30" }, // Facility costs → Facility cost analysis
  { source: "hou-15", target: "fin-12" }, // Home sale → Home equity
  { source: "hou-7", target: "fin-30" }, // Assisted living → Facility costs

  // Housing → Caregiving connections
  { source: "hou-1", target: "car-1" }, // Home safety → Aide sourcing
  { source: "hou-5", target: "car-5" }, // Age-in-place → Scheduling
  { source: "hou-19", target: "car-19" }, // Alert systems → Emergency backup

  // Housing → Medical connections
  { source: "hou-2", target: "med-22" }, // Fall prevention → Fall risk
  { source: "hou-9", target: "med-6" }, // Memory care → Cognitive assessment

  // Family → Caregiving connections
  { source: "fam-1", target: "car-2" }, // Role allocation → Vetting
  { source: "fam-2", target: "car-5" }, // Primary caregiver → Scheduling
  { source: "fam-3", target: "car-4" }, // Cost-sharing → Agency vs independent
  { source: "fam-7", target: "car-6" }, // Geographic → 24/7 coordination
  { source: "fam-15", target: "car-9" }, // Burnout → Respite care

  // Family → Legal connections
  { source: "fam-1", target: "leg-1" }, // Role allocation → Healthcare proxy
  { source: "fam-6", target: "leg-9" }, // Conflict → Guardianship

  // Family → Financial connections
  { source: "fam-3", target: "fin-14" }, // Cost-sharing → Cost projections
  { source: "fam-8", target: "fin-20" }, // Career impact → Tax implications

  // Caregiving → Medical connections
  { source: "car-22", target: "med-3" }, // Med administration → Medications
  { source: "car-11", target: "med-17" }, // Equipment → Medical equipment
  { source: "car-15", target: "med-2" }, // Transport → Specialists
  { source: "car-6", target: "med-12" }, // 24/7 care → Hospital discharge

  // Caregiving → Housing connections
  { source: "car-5", target: "hou-5" }, // Scheduling → Age-in-place
  { source: "car-19", target: "hou-19" }, // Emergency backup → Alert systems

  // Caregiving → Family connections
  { source: "car-5", target: "fam-2" }, // Scheduling → Primary caregiver
  { source: "car-9", target: "fam-15" }, // Respite → Burnout prevention
  { source: "car-7", target: "fam-4" }, // Turnover → Communication

  // Additional cross-domain complexity connections
  { source: "med-6", target: "hou-9" }, // Cognitive → Memory care
  { source: "med-23", target: "car-23" }, // Chronic disease → Personal care
  { source: "fin-6", target: "med-2" }, // Medicare choice → Specialists
  { source: "fin-28", target: "med-1" }, // Veterans benefits → PCP
  { source: "leg-4", target: "fin-15" }, // Will → Financial planning
  { source: "hou-10", target: "med-19" }, // Skilled nursing → Palliative
  { source: "fam-11", target: "hou-5" }, // Parent preferences → Age-in-place
  { source: "car-17", target: "fam-9" }, // Adult day → Work-life balance
  { source: "fin-16", target: "hou-7" }, // 10-year modeling → Assisted living
  { source: "leg-8", target: "fin-26" }, // Beneficiaries → Investments
  { source: "med-20", target: "fam-14" }, // Mental health → Emotional support
  { source: "car-12", target: "fin-18" }, // DME coverage → Medical bills
  { source: "hou-20", target: "car-28" }, // Smart home → Tech training
  { source: "fam-5", target: "car-21" }, // Family meetings → Documentation
  { source: "fin-24", target: "leg-4" }, // Social Security → Will
  { source: "med-21", target: "car-24" }, // Nutrition → Meal prep
  { source: "hou-3", target: "med-22" }, // Bathroom safety → Fall risk
  { source: "car-10", target: "fin-31" }, // Respite funding → In-home budget
  { source: "leg-3", target: "med-8" }, // Medical POA → Surgery
  { source: "fam-12", target: "leg-2" }, // Spousal → Financial POA
];

export const graphData: GraphData = {
  nodes,
  links,
};

export { domains };
