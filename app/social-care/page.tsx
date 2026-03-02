"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { saveTaskData } from "@/lib/utils/taskData";

const COMMUNITY_RESOURCES = [
  { id: "res-senior-center", label: "Local senior center", link: "https://eldercare.acl.gov", linkLabel: "Find one nearby" },
  { id: "res-faith", label: "Faith community / church group", link: "", linkLabel: "" },
  { id: "res-volunteer", label: "Volunteer visitor program (e.g., AmeriCorps Seniors)", link: "https://americorps.gov/serve/americorps-seniors", linkLabel: "AmeriCorps Seniors" },
  { id: "res-phone-buddy", label: "Phone buddy / friendly caller program", link: "https://www.ioaging.org/services/friendship-line", linkLabel: "Friendship Line" },
];

const LONELINESS_SIGNS = [
  "Declining interest in activities they used to enjoy",
  "Changes in eating or sleeping patterns",
  "Increased irritability, sadness, or anxiety",
  "Talking about feeling useless or being a burden",
  "Not answering the phone or returning calls",
  "Declining personal hygiene or home cleanliness",
];

const COMPLETION_CHECKLIST = [
  { id: "contacts-set", label: "Emergency contacts recorded" },
  { id: "checkins-set", label: "Check-in schedule established" },
  { id: "community-explored", label: "Explored community resources" },
  { id: "pet-plan", label: "Pet care plan in place (if applicable)" },
  { id: "signs-reviewed", label: "Reviewed loneliness warning signs" },
];

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface CheckInPerson {
  name: string;
  frequency: string;
  method: string;
}

export default function SocialCarePage() {
  const [parentName, setParentName] = useState("");
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: "", relationship: "", phone: "" },
  ]);
  const [checkIns, setCheckIns] = useState<CheckInPerson[]>([
    { name: "", frequency: "Weekly", method: "Phone call" },
  ]);
  const [resourceChecks, setResourceChecks] = useState<Record<string, boolean>>({});
  const [hasPet, setHasPet] = useState(false);
  const [petInfo, setPetInfo] = useState({
    petName: "",
    petType: "",
    vetName: "",
    vetPhone: "",
    emergencySitter: "",
    dailyCareNotes: "",
  });
  const [completionChecks, setCompletionChecks] = useState<Set<string>>(new Set());
  const [markedComplete, setMarkedComplete] = useState(false);
  const [contactsSaved, setContactsSaved] = useState(false);
  const [checkinsSaved, setCheckinsSaved] = useState(false);
  const [petSaved, setPetSaved] = useState(false);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);
  }, []);

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setContacts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addContact = () => {
    if (contacts.length < 3) {
      setContacts((prev) => [...prev, { name: "", relationship: "", phone: "" }]);
    }
  };

  const updateCheckIn = (index: number, field: keyof CheckInPerson, value: string) => {
    setCheckIns((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addCheckIn = () => {
    setCheckIns((prev) => [...prev, { name: "", frequency: "Weekly", method: "Phone call" }]);
  };

  const toggleResource = (id: string) => {
    setResourceChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompletion = (id: string) => {
    setCompletionChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveContacts = () => {
    const valid = contacts.filter((c) => c.name.trim());
    if (valid.length === 0) return;
    saveTaskData("Social care plan", "save_emergency_contacts", {
      contacts: valid,
    });
    setContactsSaved(true);
  };

  const handleSaveCheckIns = () => {
    const valid = checkIns.filter((c) => c.name.trim());
    if (valid.length === 0) return;
    saveTaskData("Social care plan", "save_checkin_schedule", {
      schedule: valid,
    });
    setCheckinsSaved(true);
  };

  const handleSavePetCare = () => {
    saveTaskData("Social care plan", "save_pet_care", petInfo);
    setPetSaved(true);
  };

  const handleMarkComplete = () => {
    localStorage.setItem("harbor_social_care_complete", "true");
    setMarkedComplete(true);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-sage to-[#4A7350] px-7 pt-10 pb-8">
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
            Social & Pet Care Plan
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
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-2">
            Why This Matters
          </div>
          <p className="font-sans text-sm text-slate leading-relaxed">
            Social isolation is as dangerous as smoking 15 cigarettes a day. Loneliness increases the risk of
            dementia by 50% and heart disease by 29%. Building a support network and regular check-ins
            can dramatically improve your parent&apos;s health and quality of life.
          </p>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white border-2 border-sage rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
            Emergency Contacts
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            People who can check on or help your parent in an emergency (up to 3).
          </p>
          {contacts.map((contact, i) => (
            <div key={i} className={`flex flex-col gap-2 ${i > 0 ? "mt-3 pt-3 border-t border-sand" : ""}`}>
              <div className="font-sans text-xs text-slateLight">Contact {i + 1}</div>
              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateContact(i, "name", e.target.value)}
                placeholder="Name"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
              <input
                type="text"
                value={contact.relationship}
                onChange={(e) => updateContact(i, "relationship", e.target.value)}
                placeholder="Relationship (neighbor, friend, sibling)"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => updateContact(i, "phone", e.target.value)}
                placeholder="Phone number"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
            </div>
          ))}
          {contacts.length < 3 && (
            <button
              onClick={addContact}
              className="mt-3 font-sans text-sm text-sage font-semibold hover:underline"
            >
              + Add another contact
            </button>
          )}
          <div className="mt-3">
            {!contactsSaved ? (
              <button
                onClick={handleSaveContacts}
                disabled={!contacts.some((c) => c.name.trim())}
                className="w-full rounded-[12px] px-4 py-3 bg-sage text-white font-sans text-sm font-semibold text-center hover:bg-sage/90 transition-colors disabled:opacity-50"
              >
                Save Contacts
              </button>
            ) : (
              <div className="rounded-[12px] px-4 py-3 bg-sage/10 border border-sage text-center font-sans text-sm font-semibold text-sage">
                Contacts saved
              </div>
            )}
          </div>
        </div>

        {/* Who Checks In? */}
        <div className="bg-white border-2 border-sage rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
            Who Checks In?
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Track who regularly connects with your parent and how often.
          </p>
          {checkIns.map((person, i) => (
            <div key={i} className={`flex flex-col gap-2 ${i > 0 ? "mt-3 pt-3 border-t border-sand" : ""}`}>
              <input
                type="text"
                value={person.name}
                onChange={(e) => updateCheckIn(i, "name", e.target.value)}
                placeholder="Name"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
              <div className="flex gap-2">
                <select
                  value={person.frequency}
                  onChange={(e) => updateCheckIn(i, "frequency", e.target.value)}
                  className="flex-1 rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
                >
                  <option value="Daily">Daily</option>
                  <option value="Every few days">Every few days</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Biweekly">Biweekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <select
                  value={person.method}
                  onChange={(e) => updateCheckIn(i, "method", e.target.value)}
                  className="flex-1 rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
                >
                  <option value="Phone call">Phone call</option>
                  <option value="Video call">Video call</option>
                  <option value="Text">Text</option>
                  <option value="In-person visit">In-person visit</option>
                </select>
              </div>
            </div>
          ))}
          <button
            onClick={addCheckIn}
            className="mt-3 font-sans text-sm text-sage font-semibold hover:underline"
          >
            + Add another person
          </button>
          <div className="mt-3">
            {!checkinsSaved ? (
              <button
                onClick={handleSaveCheckIns}
                disabled={!checkIns.some((c) => c.name.trim())}
                className="w-full rounded-[12px] px-4 py-3 bg-sage text-white font-sans text-sm font-semibold text-center hover:bg-sage/90 transition-colors disabled:opacity-50"
              >
                Save Check-In Schedule
              </button>
            ) : (
              <div className="rounded-[12px] px-4 py-3 bg-sage/10 border border-sage text-center font-sans text-sm font-semibold text-sage">
                Check-in schedule saved
              </div>
            )}
          </div>
        </div>

        {/* Community Resources */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
            Community Resources
          </div>
          <p className="font-sans text-xs text-slateMid mb-3">
            Check off resources you&apos;ve explored for your parent:
          </p>
          <ul className="flex flex-col gap-3">
            {COMMUNITY_RESOURCES.map((res) => (
              <li key={res.id} className="flex items-start gap-3">
                <label className="flex items-start gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={resourceChecks[res.id] || false}
                    onChange={() => toggleResource(res.id)}
                    className="mt-0.5 w-4 h-4 rounded border-slateLight accent-sage flex-shrink-0"
                  />
                  <span
                    className={`font-sans text-sm ${
                      resourceChecks[res.id] ? "text-slateLight line-through" : "text-slate"
                    }`}
                  >
                    {res.label}
                  </span>
                </label>
                {res.link && (
                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-xs text-ocean font-semibold hover:underline flex-shrink-0"
                  >
                    {res.linkLabel} &rarr;
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Loneliness Warning Signs */}
        <div className="bg-coral/5 border border-coral/20 rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-3">
            Loneliness Warning Signs
          </div>
          <ul className="flex flex-col gap-2">
            {LONELINESS_SIGNS.map((sign, i) => (
              <li key={i} className="font-sans text-sm text-slate flex items-start gap-2">
                <span className="text-coral mt-0.5 flex-shrink-0">&#x26A0;</span>
                <span>{sign}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pet Care Plan */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
            Pet Care Plan
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <div
              className={`relative w-10 h-6 rounded-full transition-colors ${
                hasPet ? "bg-sage" : "bg-sandDark"
              }`}
              onClick={() => setHasPet(!hasPet)}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  hasPet ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="font-sans text-sm text-slate">
              Does your parent have a pet?
            </span>
          </label>

          {hasPet && (
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={petInfo.petName}
                  onChange={(e) => setPetInfo((prev) => ({ ...prev, petName: e.target.value }))}
                  placeholder="Pet's name"
                  className="flex-1 rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
                />
                <input
                  type="text"
                  value={petInfo.petType}
                  onChange={(e) => setPetInfo((prev) => ({ ...prev, petType: e.target.value }))}
                  placeholder="Type (dog, cat...)"
                  className="flex-1 rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
                />
              </div>
              <input
                type="text"
                value={petInfo.vetName}
                onChange={(e) => setPetInfo((prev) => ({ ...prev, vetName: e.target.value }))}
                placeholder="Veterinarian name"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
              <input
                type="tel"
                value={petInfo.vetPhone}
                onChange={(e) => setPetInfo((prev) => ({ ...prev, vetPhone: e.target.value }))}
                placeholder="Vet phone number"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
              <input
                type="text"
                value={petInfo.emergencySitter}
                onChange={(e) => setPetInfo((prev) => ({ ...prev, emergencySitter: e.target.value }))}
                placeholder="Emergency pet sitter (name & phone)"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
              />
              <textarea
                value={petInfo.dailyCareNotes}
                onChange={(e) => setPetInfo((prev) => ({ ...prev, dailyCareNotes: e.target.value }))}
                placeholder="Daily care notes (feeding schedule, medications, walk times...)"
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white min-h-[70px] resize-y"
              />
              <div className="mt-1">
                {!petSaved ? (
                  <button
                    onClick={handleSavePetCare}
                    disabled={!petInfo.petName.trim()}
                    className="w-full rounded-[12px] px-4 py-3 bg-sage text-white font-sans text-sm font-semibold text-center hover:bg-sage/90 transition-colors disabled:opacity-50"
                  >
                    Save Pet Care Plan
                  </button>
                ) : (
                  <div className="rounded-[12px] px-4 py-3 bg-sage/10 border border-sage text-center font-sans text-sm font-semibold text-sage">
                    Pet care plan saved
                  </div>
                )}
              </div>
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
              Social & pet care plan marked as complete
            </div>
          )}
        </div>

        {/* Need Help */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Need Help?
          </div>
          <p className="font-sans text-sm text-slateMid leading-relaxed mb-3">
            Your local Area Agency on Aging can connect you with companionship programs, adult day care,
            and other social support services in your area.
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
