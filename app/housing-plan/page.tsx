"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { saveTaskData } from "@/lib/utils/taskData";

const LIVING_ARRANGEMENTS = [
  "Own home (no mortgage)",
  "Own home (with mortgage)",
  "Renting",
  "Living with family",
  "Independent living community",
  "Assisted living",
  "Other",
];

const HOME_SERVICES = [
  { id: "svc-meals", label: "Meal delivery or meal prep help" },
  { id: "svc-cleaning", label: "Housekeeping / cleaning service" },
  { id: "svc-yard", label: "Yard maintenance / snow removal" },
  { id: "svc-handyman", label: "Handyman / home repair service" },
  { id: "svc-homecare", label: "In-home care aide (personal care)" },
  { id: "svc-laundry", label: "Laundry assistance" },
];

const TRANSITION_QUESTIONS = [
  "Could your parent afford assisted living if needed? ($4,500-$6,000/month average)",
  "Have you toured or researched any facilities in their area?",
  "Is your parent on any waitlists? (Good facilities can have 6-18 month waits)",
  "Does your parent have long-term care insurance that covers facility stays?",
  "Have you discussed what would trigger a move (e.g., can't manage stairs, needs daily help)?",
];

const COMPLETION_CHECKLIST = [
  { id: "arrangement", label: "Documented current living arrangement" },
  { id: "costs", label: "Recorded housing costs" },
  { id: "services", label: "Assessed home services and support needs" },
  { id: "transition", label: "Discussed transition planning" },
  { id: "contacts", label: "Listed key housing-related contacts" },
];

export default function HousingPlanPage() {
  const [parentName, setParentName] = useState("");
  const [livingArrangement, setLivingArrangement] = useState("");
  const [housingCost, setHousingCost] = useState("");
  const [costFrequency, setCostFrequency] = useState("monthly");
  const [ownershipNotes, setOwnershipNotes] = useState("");
  const [serviceChecks, setServiceChecks] = useState<Record<string, boolean>>({});
  const [serviceNotes, setServiceNotes] = useState("");
  const [transitionChecks, setTransitionChecks] = useState<Record<number, boolean>>({});
  const [transitionNotes, setTransitionNotes] = useState("");
  const [landlordOrHoa, setLandlordOrHoa] = useState({ name: "", phone: "" });
  const [completionChecks, setCompletionChecks] = useState<Set<string>>(new Set());
  const [markedComplete, setMarkedComplete] = useState(false);
  const [arrangementSaved, setArrangementSaved] = useState(false);
  const [costSaved, setCostSaved] = useState(false);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) {
      setParentName(profile.name);
      if (profile.livingArrangement) {
        setLivingArrangement(profile.livingArrangement);
      }
    }
  }, []);

  const toggleService = (id: string) => {
    setServiceChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTransition = (idx: number) => {
    setTransitionChecks((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleCompletion = (id: string) => {
    setCompletionChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveArrangement = () => {
    if (!livingArrangement) return;
    saveTaskData("Housing plan", "save_housing_details", {
      livingArrangement,
      ownershipNotes,
      landlordOrHoa: landlordOrHoa.name ? landlordOrHoa : undefined,
    });
    setArrangementSaved(true);
  };

  const handleSaveCost = () => {
    if (!housingCost) return;
    saveTaskData("Housing plan", "save_housing_cost", {
      amount: housingCost,
      frequency: costFrequency,
    });
    setCostSaved(true);
  };

  const handleMarkComplete = () => {
    localStorage.setItem("harbor_housing_plan_complete", "true");
    setMarkedComplete(true);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-amber to-[#A87828] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="relative">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Guides
          </Link>
          <h1 className="font-serif text-[26px] font-semibold text-white tracking-tight">
            Housing & Living Plan
          </h1>
          {parentName && (
            <div className="font-sans text-sm text-white/80 mt-1">
              For {parentName}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {/* Why This Matters */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-2">
            Why This Matters
          </div>
          <p className="font-sans text-sm text-slate leading-relaxed">
            Housing is often the biggest expense and biggest decision in caregiving. Documenting
            your parent&apos;s current situation — costs, ownership, support needs — lets you plan
            ahead instead of scrambling during a crisis. Families who plan housing transitions
            in advance report significantly less stress and better outcomes.
          </p>
        </div>

        {/* Current Living Arrangement */}
        <div className="bg-white border-2 border-amber rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
            Current Living Arrangement
          </div>
          <select
            value={livingArrangement}
            onChange={(e) => setLivingArrangement(e.target.value)}
            className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white mb-3"
          >
            <option value="">Select arrangement...</option>
            {LIVING_ARRANGEMENTS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <textarea
            value={ownershipNotes}
            onChange={(e) => setOwnershipNotes(e.target.value)}
            placeholder="Details: address, how long they've lived there, mortgage company, lease terms, etc."
            className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white min-h-[70px] resize-y mb-3"
          />
          <div className="flex flex-col gap-2 mb-3">
            <input
              type="text"
              value={landlordOrHoa.name}
              onChange={(e) => setLandlordOrHoa((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Landlord / HOA / property manager name (if applicable)"
              className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
            />
            <input
              type="tel"
              value={landlordOrHoa.phone}
              onChange={(e) => setLandlordOrHoa((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
            />
          </div>
          {!arrangementSaved ? (
            <button
              onClick={handleSaveArrangement}
              disabled={!livingArrangement}
              className="w-full rounded-[12px] px-4 py-3 bg-amber text-white font-sans text-sm font-semibold text-center hover:bg-amber/90 transition-colors disabled:opacity-50"
            >
              Save Living Arrangement
            </button>
          ) : (
            <div className="rounded-[12px] px-4 py-3 bg-amber/10 border border-amber text-center font-sans text-sm font-semibold text-amber">
              Living arrangement saved
            </div>
          )}
        </div>

        {/* Housing Costs */}
        <div className="bg-white border-2 border-amber rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
            Housing Costs
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Knowing the current cost helps plan for transitions and assess long-term affordability.
          </p>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <input
                type="text"
                value={housingCost}
                onChange={(e) => setHousingCost(e.target.value)}
                placeholder="$ Amount"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
            </div>
            <select
              value={costFrequency}
              onChange={(e) => setCostFrequency(e.target.value)}
              className="rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
            >
              <option value="monthly">/ month</option>
              <option value="annually">/ year</option>
            </select>
          </div>
          <p className="font-sans text-xs text-slateLight mb-3">
            Include rent/mortgage, property tax, HOA fees, and insurance if known.
          </p>
          {!costSaved ? (
            <button
              onClick={handleSaveCost}
              disabled={!housingCost}
              className="w-full rounded-[12px] px-4 py-3 bg-amber text-white font-sans text-sm font-semibold text-center hover:bg-amber/90 transition-colors disabled:opacity-50"
            >
              Save Housing Cost
            </button>
          ) : (
            <div className="rounded-[12px] px-4 py-3 bg-amber/10 border border-amber text-center font-sans text-sm font-semibold text-amber">
              Housing cost saved
            </div>
          )}
        </div>

        {/* Home Services & Support */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
            Home Services & Support
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Check services your parent currently has or needs:
          </p>
          <ul className="flex flex-col gap-2.5 mb-3">
            {HOME_SERVICES.map((svc) => (
              <li key={svc.id}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceChecks[svc.id] || false}
                    onChange={() => toggleService(svc.id)}
                    className="mt-0.5 w-4 h-4 rounded border-slateLight accent-amber flex-shrink-0"
                  />
                  <span className={`font-sans text-sm ${serviceChecks[svc.id] ? "text-slate font-medium" : "text-slate"}`}>
                    {svc.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <textarea
            value={serviceNotes}
            onChange={(e) => setServiceNotes(e.target.value)}
            placeholder="Notes: provider names, costs, schedules, gaps in coverage..."
            className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white min-h-[60px] resize-y"
          />
        </div>

        {/* Transition Planning */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
            Transition Planning
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Even if your parent plans to stay in their home, thinking through &ldquo;what if&rdquo; scenarios
            prevents rushed decisions. Check off questions you&apos;ve addressed:
          </p>
          <ul className="flex flex-col gap-3 mb-3">
            {TRANSITION_QUESTIONS.map((q, i) => (
              <li key={i}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transitionChecks[i] || false}
                    onChange={() => toggleTransition(i)}
                    className="mt-0.5 w-4 h-4 rounded border-slateLight accent-amber flex-shrink-0"
                  />
                  <span className={`font-sans text-sm ${transitionChecks[i] ? "text-slateLight line-through" : "text-slate"}`}>
                    {q}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <textarea
            value={transitionNotes}
            onChange={(e) => setTransitionNotes(e.target.value)}
            placeholder="Notes about facilities you've researched, waitlists, preferences..."
            className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white min-h-[60px] resize-y"
          />
        </div>

        {/* Cost Comparison */}
        <div className="bg-amber/5 border border-amber/20 rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
            Average Monthly Costs (2025)
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: "In-home care aide (44 hrs/wk)", cost: "$6,300" },
              { label: "Adult day care", cost: "$1,700" },
              { label: "Assisted living", cost: "$5,350" },
              { label: "Nursing home (semi-private)", cost: "$8,700" },
              { label: "Nursing home (private)", cost: "$9,800" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="font-sans text-sm text-slate">{item.label}</span>
                <span className="font-sans text-sm font-semibold text-slate">{item.cost}</span>
              </div>
            ))}
          </div>
          <p className="font-sans text-xs text-slateMid mt-3">
            Source: Genworth Cost of Care Survey. Costs vary significantly by region.
          </p>
        </div>

        {/* Resources */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Resources
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="https://eldercare.acl.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
            >
              <div className="font-sans text-sm font-semibold text-slate">Eldercare Locator</div>
              <div className="font-sans text-xs text-slateMid">Find local aging services, housing counselors, and support</div>
            </a>
            <a
              href="https://www.medicare.gov/care-compare/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
            >
              <div className="font-sans text-sm font-semibold text-slate">Medicare Care Compare</div>
              <div className="font-sans text-xs text-slateMid">Compare nursing homes and home health agencies by quality rating</div>
            </a>
            <a
              href="https://www.genworth.com/aging-and-you/finances/cost-of-care.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
            >
              <div className="font-sans text-sm font-semibold text-slate">Genworth Cost of Care</div>
              <div className="font-sans text-xs text-slateMid">Look up care costs in your parent&apos;s specific area</div>
            </a>
          </div>
        </div>

        {/* Completion Checklist */}
        <div className="bg-white border-2 border-sage rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
            Completion Checklist
          </div>
          <ul className="flex flex-col gap-3">
            {COMPLETION_CHECKLIST.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={completionChecks.has(item.id)}
                    onChange={() => toggleCompletion(item.id)}
                    className="mt-0.5 w-4 h-4 rounded border-slateLight accent-sage flex-shrink-0"
                  />
                  <span
                    className={`font-sans text-sm ${
                      completionChecks.has(item.id) ? "text-slateLight line-through" : "text-slate"
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {!markedComplete ? (
            <button
              onClick={handleMarkComplete}
              className="w-full mt-4 rounded-[12px] px-4 py-3.5 bg-sage text-white border-2 border-sage font-sans text-sm font-semibold text-center hover:bg-sage/90 transition-colors"
            >
              Mark as Complete
            </button>
          ) : (
            <div className="mt-4 rounded-[12px] px-4 py-3.5 bg-sage/10 border-2 border-sage text-center font-sans text-sm font-semibold text-sage">
              Housing & living plan marked as complete
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
