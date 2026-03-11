"use client";

import { useState } from "react";
import {
  addNote,
  deleteNote,
  exportSessionNotes,
  type HospitalNote,
} from "@/lib/utils/hospitalNotes";

type NoteCategory = HospitalNote["category"];

const CATEGORY_CHIPS: { id: NoteCategory; label: string }[] = [
  { id: "doctor-said", label: "Doctor Said" },
  { id: "decision", label: "Decision" },
  { id: "question", label: "Question" },
  { id: "general", label: "General" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "doctor-said": "bg-ocean/10 text-ocean",
  decision: "bg-sage/10 text-sage",
  question: "bg-amber/10 text-amber",
  general: "bg-sand text-slateMid",
};

interface NotesTabProps {
  notes: HospitalNote[];
  onNotesChange: () => void;
}

export default function NotesTab({ notes, onNotesChange }: NotesTabProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("general");
  const [copySuccess, setCopySuccess] = useState(false);

  const handleAddNote = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    addNote(trimmed, { category });
    setContent("");
    onNotesChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const handleDelete = (noteId: string) => {
    deleteNote(noteId);
    onNotesChange();
  };

  const handleExport = async () => {
    const text = exportSessionNotes();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const sortedNotes = [...notes].reverse();

  return (
    <div className="flex flex-col gap-4">
      {/* Quick-add bar */}
      <div className="bg-white border border-sandDark rounded-[14px] px-4 py-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a note... (Enter to save)"
          rows={2}
          className="w-full font-sans text-sm text-slate placeholder:text-slateLight resize-none border-none outline-none bg-transparent"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setCategory(chip.id)}
                className={`font-sans text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  category === chip.id
                    ? "bg-coral text-white"
                    : "bg-sand/50 text-slateMid hover:bg-sand"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleAddNote}
            disabled={!content.trim()}
            className="font-sans text-xs font-semibold text-white bg-coral px-3 py-1.5 rounded-full disabled:opacity-40 transition-opacity"
          >
            Add
          </button>
        </div>
      </div>

      {/* Export button */}
      {notes.length > 0 && (
        <button
          onClick={handleExport}
          className={`w-full rounded-[12px] px-4 py-3 flex items-center justify-center gap-2 transition-all font-sans text-sm font-semibold ${
            copySuccess
              ? "bg-sage/20 border-2 border-sage text-sage"
              : "bg-white border-2 border-ocean text-ocean hover:bg-ocean/5"
          }`}
        >
          {copySuccess ? "Copied All Notes!" : "Copy All Notes"}
        </button>
      )}

      {/* Notes list */}
      {sortedNotes.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortedNotes.map((note) => (
            <div key={note.id} className="bg-white border border-sandDark rounded-[14px] px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      CATEGORY_COLORS[note.category || "general"]
                    }`}
                  >
                    {CATEGORY_CHIPS.find((c) => c.id === note.category)?.label || "Note"}
                  </span>
                  {note.providerName && (
                    <span className="font-sans text-[10px] text-slateMid">
                      {note.providerName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="font-sans text-[10px] text-slateLight hover:text-coral transition-colors"
                >
                  Delete
                </button>
              </div>
              <div className="font-sans text-sm text-slate whitespace-pre-wrap">{note.content}</div>
              <div className="font-sans text-[10px] text-slateLight mt-2">
                {new Date(note.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-8 text-center">
          <div className="text-3xl mb-3">{"\ud83d\udcdd"}</div>
          <div className="font-sans text-sm text-slate mb-1">No notes yet</div>
          <div className="font-sans text-xs text-slateMid">
            Capture what doctors say, decisions made, and questions to ask
          </div>
        </div>
      )}
    </div>
  );
}
