"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { saveTaskData } from "@/lib/utils/taskData";
import Disclaimer from "@/components/Disclaimer";

const ROOM_CHECKLISTS: { room: string; items: { id: string; label: string }[] }[] = [
  {
    room: "Bathroom",
    items: [
      { id: "bath-1", label: "Install grab bars near toilet and shower" },
      { id: "bath-2", label: "Add non-slip mats in tub/shower and on floor" },
      { id: "bath-3", label: "Ensure adequate lighting (nightlight for nighttime)" },
      { id: "bath-4", label: "Raise toilet seat or add a seat riser" },
      { id: "bath-5", label: "Remove loose rugs or replace with non-slip versions" },
    ],
  },
  {
    room: "Kitchen",
    items: [
      { id: "kit-1", label: "Move frequently used items to waist-height shelves" },
      { id: "kit-2", label: "Ensure stove has auto-shutoff or knob covers" },
      { id: "kit-3", label: "Check that lighting is bright, especially near counters" },
      { id: "kit-4", label: "Remove throw rugs or secure with non-slip backing" },
      { id: "kit-5", label: "Keep a fire extinguisher accessible and not expired" },
    ],
  },
  {
    room: "Bedroom",
    items: [
      { id: "bed-1", label: "Ensure path from bed to bathroom is clear and lit" },
      { id: "bed-2", label: "Bed height allows easy sitting and standing" },
      { id: "bed-3", label: "Phone or alert device within reach from bed" },
      { id: "bed-4", label: "Nightlight or motion-activated light in room" },
      { id: "bed-5", label: "Remove cords and clutter from walking paths" },
    ],
  },
  {
    room: "Stairs & Hallways",
    items: [
      { id: "stair-1", label: "Sturdy handrails on both sides of stairs" },
      { id: "stair-2", label: "Good lighting at top and bottom of stairs" },
      { id: "stair-3", label: "No loose carpet or worn treads on steps" },
      { id: "stair-4", label: "Clear hallways of furniture and clutter" },
      { id: "stair-5", label: "Consider a stairlift if mobility is declining" },
    ],
  },
  {
    room: "General",
    items: [
      { id: "gen-1", label: "Smoke and CO detectors installed and tested" },
      { id: "gen-2", label: "Door locks are easy to operate (lever handles)" },
      { id: "gen-3", label: "Emergency numbers posted visibly" },
      { id: "gen-4", label: "Medical alert system in place (if living alone)" },
      { id: "gen-5", label: "Walkways outside are even, well-lit, and clear of debris" },
    ],
  },
];

const COMPLETION_CHECKLIST = [
  { id: "assessed", label: "Completed room-by-room safety walkthrough" },
  { id: "fixes-planned", label: "Identified and prioritized fixes needed" },
  { id: "emergency-contact", label: "Emergency contact information recorded" },
  { id: "aging-plan", label: "Discussed aging in place vs. moving preferences" },
  { id: "timeline", label: "Set a timeline for completing safety improvements" },
];

const PITFALLS = [
  "Waiting until after a fall to make changes — prevention is far easier than recovery",
  "Focusing only on major renovations and ignoring quick wins like nightlights and grab bars",
  "Not involving your parent in decisions — they may resist changes they didn't agree to",
  "Forgetting outdoor areas like porches, walkways, and driveways",
  "Assuming one assessment is enough — revisit every 6-12 months as needs change",
];

export default function HomeSafetyPage() {
  const [parentName, setParentName] = useState("");
  const [roomChecks, setRoomChecks] = useState<Record<string, boolean>>({});
  const [agingNotes, setAgingNotes] = useState("");
  const [emergencyContact, setEmergencyContact] = useState({ name: "", relationship: "", phone: "" });
  const [completionChecks, setCompletionChecks] = useState<Set<string>>(new Set());
  const [markedComplete, setMarkedComplete] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) {
      setParentName(profile.name);
    }
    // Load saved room checks from localStorage
    const saved = localStorage.getItem("harbor_home_safety_rooms");
    if (saved) {
      try { setRoomChecks(JSON.parse(saved)); } catch { /* ignore */ }
    }
    const savedNotes = localStorage.getItem("harbor_home_safety_notes");
    if (savedNotes) setAgingNotes(savedNotes);
  }, []);

  // Persist room checks to localStorage on change
  useEffect(() => {
    if (Object.keys(roomChecks).length > 0) {
      localStorage.setItem("harbor_home_safety_rooms", JSON.stringify(roomChecks));
    }
  }, [roomChecks]);

  useEffect(() => {
    if (agingNotes) {
      localStorage.setItem("harbor_home_safety_notes", agingNotes);
    }
  }, [agingNotes]);

  const toggleRoomCheck = (id: string) => {
    setRoomChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompletion = (id: string) => {
    setCompletionChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveContact = () => {
    if (!emergencyContact.name.trim()) return;
    saveTaskData("Home safety assessment", "save_emergency_contact", {
      name: emergencyContact.name,
      relationship: emergencyContact.relationship,
      phone: emergencyContact.phone,
    });
    setContactSaved(true);
  };

  const handleMarkComplete = () => {
    localStorage.setItem("harbor_home_safety_complete", "true");
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
            Home Safety Assessment
          </h1>
          {parentName && (
            <div className="font-sans text-sm text-white/80 mt-1">
              For {parentName}&apos;s home
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        <Disclaimer type="general" />

        {/* What Is This? */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-2">
            What Is This?
          </div>
          <p className="font-sans text-sm text-slate leading-relaxed">
            A room-by-room safety assessment helps identify fall hazards and accessibility issues in your parent&apos;s home.
            Falls are the leading cause of injury for adults over 65 — most happen at home, and most are preventable.
          </p>
        </div>

        {/* Room-by-Room Checklists */}
        {ROOM_CHECKLISTS.map((room) => (
          <div key={room.room} className="bg-white border-2 border-amber rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
              {room.room}
            </div>
            <ul className="flex flex-col gap-2.5">
              {room.items.map((item) => (
                <li key={item.id}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomChecks[item.id] || false}
                      onChange={() => toggleRoomCheck(item.id)}
                      className="mt-0.5 w-4 h-4 rounded border-slateLight accent-amber flex-shrink-0"
                    />
                    <span
                      className={`font-sans text-sm ${
                        roomChecks[item.id] ? "text-slateLight line-through" : "text-slate"
                      }`}
                    >
                      {item.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Aging in Place vs. Moving */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-2">
            Aging in Place vs. Moving
          </div>
          <p className="font-sans text-sm text-slateMid leading-relaxed mb-3">
            Think about your parent&apos;s current and future needs. Consider these questions:
          </p>
          <ul className="flex flex-col gap-2 mb-3">
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber mt-0.5 flex-shrink-0">&bull;</span>
              Can the home be modified to meet their needs for the next 3-5 years?
            </li>
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber mt-0.5 flex-shrink-0">&bull;</span>
              Is the home close to medical care, groceries, and social activities?
            </li>
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber mt-0.5 flex-shrink-0">&bull;</span>
              Can they afford the cost of home modifications vs. assisted living?
            </li>
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber mt-0.5 flex-shrink-0">&bull;</span>
              What does your parent prefer — and what is realistic?
            </li>
          </ul>
          <textarea
            value={agingNotes}
            onChange={(e) => setAgingNotes(e.target.value)}
            placeholder="Notes about your parent's preferences, concerns, or plans..."
            className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white min-h-[80px] resize-y"
          />
        </div>

        {/* Researching Senior Living */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-2">
            Researching Senior Living
          </div>
          <p className="font-sans text-sm text-slateMid leading-relaxed mb-3">
            If moving might be the right choice, here are the main types of senior living:
          </p>
          <ul className="flex flex-col gap-2 mb-3">
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber font-semibold mt-0.5 flex-shrink-0">&bull;</span>
              <span><span className="font-semibold">Independent Living</span> — for active seniors who want community and convenience</span>
            </li>
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber font-semibold mt-0.5 flex-shrink-0">&bull;</span>
              <span><span className="font-semibold">Assisted Living</span> — help with daily activities (bathing, meals, meds)</span>
            </li>
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber font-semibold mt-0.5 flex-shrink-0">&bull;</span>
              <span><span className="font-semibold">Memory Care</span> — specialized for dementia or Alzheimer&apos;s</span>
            </li>
            <li className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-amber font-semibold mt-0.5 flex-shrink-0">&bull;</span>
              <span><span className="font-semibold">Nursing Home</span> — 24-hour skilled nursing care</span>
            </li>
          </ul>
          <p className="font-sans text-xs text-slateMid mb-2">
            Questions to ask when visiting facilities: staffing ratios, costs, what&apos;s included, visiting policies, discharge policies.
          </p>
          <a
            href="https://eldercare.acl.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-sm text-ocean font-semibold hover:underline"
          >
            Eldercare Locator (eldercare.acl.gov) &rarr;
          </a>
        </div>

        {/* Emergency Contact Form */}
        <div className="bg-white border-2 border-amber rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
            Emergency Contact
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Record a local emergency contact who can respond quickly if needed.
          </p>
          <div className="flex flex-col gap-2.5 mb-3">
            <input
              type="text"
              value={emergencyContact.name}
              onChange={(e) => setEmergencyContact((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
              className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
            />
            <input
              type="text"
              value={emergencyContact.relationship}
              onChange={(e) => setEmergencyContact((prev) => ({ ...prev, relationship: e.target.value }))}
              placeholder="Relationship (e.g., neighbor, sibling)"
              className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
            />
            <input
              type="tel"
              value={emergencyContact.phone}
              onChange={(e) => setEmergencyContact((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
            />
          </div>
          {!contactSaved ? (
            <button
              onClick={handleSaveContact}
              disabled={!emergencyContact.name.trim()}
              className="w-full rounded-[12px] px-4 py-3 bg-amber text-white font-sans text-sm font-semibold text-center hover:bg-amber/90 transition-colors disabled:opacity-50"
            >
              Save Contact
            </button>
          ) : (
            <div className="rounded-[12px] px-4 py-3 bg-amber/10 border border-amber text-center font-sans text-sm font-semibold text-amber">
              Contact saved
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
              Home safety assessment marked as complete
            </div>
          )}
        </div>

        {/* Common Pitfalls */}
        <div className="bg-coral/5 border border-coral/20 rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-3">
            Common Pitfalls
          </div>
          <ul className="flex flex-col gap-2">
            {PITFALLS.map((pitfall, i) => (
              <li key={i} className="font-sans text-sm text-slate flex items-start gap-2">
                <span className="text-coral mt-0.5 flex-shrink-0">&#x26A0;</span>
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Need Help */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Need Help?
          </div>
          <p className="font-sans text-sm text-slateMid leading-relaxed mb-3">
            Many communities offer free home safety assessments for seniors. Contact your local Area Agency on Aging to ask about programs in your area.
          </p>
          <a
            href="https://eldercare.acl.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-sm text-ocean font-semibold hover:underline"
          >
            Find your local agency &rarr;
          </a>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
