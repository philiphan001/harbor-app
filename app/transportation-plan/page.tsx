"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { saveTaskData } from "@/lib/utils/taskData";

const TRANSPORT_OPTIONS = [
  { id: "drives-self", label: "Drives themselves" },
  { id: "family-drives", label: "Family member drives them" },
  { id: "public-transit", label: "Public transit (bus, subway)" },
  { id: "ride-service", label: "Ride service (Uber, Lyft)" },
  { id: "medical-transport", label: "Medical transport / NEMT" },
  { id: "paratransit", label: "Paratransit / dial-a-ride" },
  { id: "walks", label: "Walks / uses wheelchair" },
  { id: "volunteer-driver", label: "Volunteer driver program" },
];

const PRIMARY_BACKUP_OPTIONS = [
  "Family member",
  "Drives themselves",
  "Uber / Lyft",
  "Medical transport (NEMT)",
  "Paratransit",
  "Volunteer driver program",
  "Public transit",
  "Taxi",
  "Other",
];

const DELIVERY_SERVICES = [
  { id: "del-grocery", label: "Grocery delivery (Instacart, Walmart, etc.)" },
  { id: "del-pharmacy", label: "Pharmacy delivery (CVS, Walgreens, Amazon Pharmacy)" },
  { id: "del-meals", label: "Meal delivery (Meals on Wheels, Mom's Meals)" },
  { id: "del-amazon", label: "General delivery (Amazon, etc.)" },
];

const COMPLETION_CHECKLIST = [
  { id: "inventory", label: "Reviewed current transportation methods" },
  { id: "primary-set", label: "Identified primary transportation for appointments" },
  { id: "backup-set", label: "Identified a backup transportation option" },
  { id: "delivery", label: "Set up delivery services for essentials" },
  { id: "driving-talk", label: "Discussed driving safety (if applicable)" },
];

export default function TransportationPlanPage() {
  const [parentName, setParentName] = useState("");
  const [currentTransport, setCurrentTransport] = useState<Record<string, boolean>>({});
  const [primaryTransport, setPrimaryTransport] = useState("");
  const [backupTransport, setBackupTransport] = useState("");
  const [deliveryChecks, setDeliveryChecks] = useState<Record<string, boolean>>({});
  const [completionChecks, setCompletionChecks] = useState<Set<string>>(new Set());
  const [markedComplete, setMarkedComplete] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [deliverySaved, setDeliverySaved] = useState(false);
  const [showDrivingConvo, setShowDrivingConvo] = useState(false);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);
  }, []);

  const toggleTransport = (id: string) => {
    setCurrentTransport((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDelivery = (id: string) => {
    setDeliveryChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompletion = (id: string) => {
    setCompletionChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSavePlan = () => {
    saveTaskData("Transportation plan", "save_transport_plan", {
      currentMethods: Object.entries(currentTransport)
        .filter(([, v]) => v)
        .map(([k]) => k),
      primaryTransport,
      backupTransport,
    });
    setPlanSaved(true);
  };

  const handleSaveDelivery = () => {
    saveTaskData("Transportation plan", "save_delivery_services", {
      services: Object.entries(deliveryChecks)
        .filter(([, v]) => v)
        .map(([k]) => k),
    });
    setDeliverySaved(true);
  };

  const handleMarkComplete = () => {
    localStorage.setItem("harbor_transportation_plan_complete", "true");
    setMarkedComplete(true);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
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
            Transportation Plan
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
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
            Why This Matters
          </div>
          <p className="font-sans text-sm text-slate leading-relaxed">
            Reliable transportation is essential for medical appointments, social connection, and independence.
            When driving is no longer safe, having a plan prevents missed appointments and isolation.
            Over 600,000 seniors stop driving each year — planning ahead makes the transition easier.
          </p>
        </div>

        {/* Current Transport Inventory */}
        <div className="bg-white border-2 border-ocean rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Current Transportation
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Check all the ways your parent currently gets around:
          </p>
          <ul className="flex flex-col gap-2.5">
            {TRANSPORT_OPTIONS.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentTransport[item.id] || false}
                    onChange={() => toggleTransport(item.id)}
                    className="mt-0.5 w-4 h-4 rounded border-slateLight accent-ocean flex-shrink-0"
                  />
                  <span
                    className={`font-sans text-sm ${
                      currentTransport[item.id] ? "text-slate font-medium" : "text-slate"
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Primary & Backup Transport */}
        <div className="bg-white border-2 border-ocean rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Primary & Backup Plan
          </div>
          <div className="flex flex-col gap-3 mb-3">
            <div>
              <label className="font-sans text-xs text-slateMid mb-1 block">
                Primary transport for medical appointments
              </label>
              <select
                value={primaryTransport}
                onChange={(e) => setPrimaryTransport(e.target.value)}
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              >
                <option value="">Select...</option>
                {PRIMARY_BACKUP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-sans text-xs text-slateMid mb-1 block">
                Backup if primary isn&apos;t available
              </label>
              <select
                value={backupTransport}
                onChange={(e) => setBackupTransport(e.target.value)}
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              >
                <option value="">Select...</option>
                {PRIMARY_BACKUP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          {!planSaved ? (
            <button
              onClick={handleSavePlan}
              disabled={!primaryTransport}
              className="w-full rounded-[12px] px-4 py-3 bg-ocean text-white font-sans text-sm font-semibold text-center hover:bg-ocean/90 transition-colors disabled:opacity-50"
            >
              Save Transport Plan
            </button>
          ) : (
            <div className="rounded-[12px] px-4 py-3 bg-ocean/10 border border-ocean text-center font-sans text-sm font-semibold text-ocean">
              Plan saved
            </div>
          )}
        </div>

        {/* Local Resources */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Transportation Resources
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="https://www.medicaid.gov/medicaid/benefits/nonemergency-medical-transportation/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
            >
              <div className="font-sans text-sm font-semibold text-slate">Medicaid NEMT</div>
              <div className="font-sans text-xs text-slateMid">Non-emergency medical transport — free for Medicaid recipients</div>
            </a>
            <a
              href="https://www.aaa.com/stop/senior-driving"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
            >
              <div className="font-sans text-sm font-semibold text-slate">AAA Senior Driving</div>
              <div className="font-sans text-xs text-slateMid">Resources for older drivers and driving alternatives</div>
            </a>
            <a
              href="https://gogograndparent.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
            >
              <div className="font-sans text-sm font-semibold text-slate">GoGoGrandparent</div>
              <div className="font-sans text-xs text-slateMid">Order rides by phone call — no smartphone needed</div>
            </a>
            <a
              href="https://www.uberhealth.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
            >
              <div className="font-sans text-sm font-semibold text-slate">Uber Health</div>
              <div className="font-sans text-xs text-slateMid">Healthcare facility can schedule rides for patients</div>
            </a>
          </div>
        </div>

        {/* Delivery Services */}
        <div className="bg-white border-2 border-ocean rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Delivery Services
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Reduce the need for transportation by setting up delivery for essentials:
          </p>
          <ul className="flex flex-col gap-2.5 mb-3">
            {DELIVERY_SERVICES.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryChecks[item.id] || false}
                    onChange={() => toggleDelivery(item.id)}
                    className="mt-0.5 w-4 h-4 rounded border-slateLight accent-ocean flex-shrink-0"
                  />
                  <span
                    className={`font-sans text-sm ${
                      deliveryChecks[item.id] ? "text-slateLight line-through" : "text-slate"
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {!deliverySaved ? (
            <button
              onClick={handleSaveDelivery}
              className="w-full rounded-[12px] px-4 py-3 bg-ocean text-white font-sans text-sm font-semibold text-center hover:bg-ocean/90 transition-colors"
            >
              Save Delivery Setup
            </button>
          ) : (
            <div className="rounded-[12px] px-4 py-3 bg-ocean/10 border border-ocean text-center font-sans text-sm font-semibold text-ocean">
              Delivery services saved
            </div>
          )}
        </div>

        {/* The Driving Conversation (Collapsible) */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <button
            onClick={() => setShowDrivingConvo(!showDrivingConvo)}
            className="w-full flex items-center justify-between"
          >
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean">
              The Driving Conversation
            </div>
            <span className="text-slateMid text-lg">{showDrivingConvo ? "−" : "+"}</span>
          </button>
          {showDrivingConvo && (
            <div className="mt-3">
              <p className="font-sans text-sm text-slate leading-relaxed mb-3">
                Talking to a parent about giving up driving is one of the hardest conversations.
                Here are some tips:
              </p>
              <ul className="flex flex-col gap-2">
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-ocean mt-0.5 flex-shrink-0">&bull;</span>
                  <span>Focus on safety, not age — &ldquo;I&apos;ve noticed some close calls&rdquo; not &ldquo;You&apos;re too old&rdquo;</span>
                </li>
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-ocean mt-0.5 flex-shrink-0">&bull;</span>
                  <span>Have alternatives ready before the conversation</span>
                </li>
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-ocean mt-0.5 flex-shrink-0">&bull;</span>
                  <span>Suggest a driving evaluation with their doctor or AAA</span>
                </li>
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-ocean mt-0.5 flex-shrink-0">&bull;</span>
                  <span>Emphasize what they gain (less stress, no car expenses) not just what they lose</span>
                </li>
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-ocean mt-0.5 flex-shrink-0">&bull;</span>
                  <span>It may take multiple conversations — be patient and consistent</span>
                </li>
              </ul>
            </div>
          )}
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
              Transportation plan marked as complete
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
