export type DisclaimerType = "legal" | "medical" | "financial" | "emergency" | "general";

interface DisclaimerProps {
  type: DisclaimerType;
  className?: string;
}

const DISCLAIMER_CONFIG: Record<DisclaimerType, { icon: string; text: string }> = {
  legal: {
    icon: "⚖️",
    text: "This is general information, not legal advice. Laws vary by state and change over time. Consult a licensed attorney in your state before making legal decisions.",
  },
  medical: {
    icon: "🩺",
    text: "This is general health information, not medical advice. Always consult your parent\u2019s doctor or pharmacist before making medical decisions or changing medications.",
  },
  financial: {
    icon: "💰",
    text: "This is general information, not financial or benefits advice. Eligibility and program details vary. Consult a financial advisor or benefits counselor to confirm specifics.",
  },
  emergency: {
    icon: "🚨",
    text: "In a medical emergency, call 911 first. This tool provides general guidance to help you stay organized\u2014it is not a substitute for professional emergency services.",
  },
  general: {
    icon: "ℹ️",
    text: "This tool provides general caregiving information and suggestions. It is not a substitute for professional advice. Verify important details with qualified professionals.",
  },
};

export default function Disclaimer({ type, className = "" }: DisclaimerProps) {
  const config = DISCLAIMER_CONFIG[type];

  return (
    <div
      className={`flex items-start gap-2.5 bg-sand/40 rounded-xl px-4 py-3 ${className}`}
      role="note"
      aria-label="Disclaimer"
    >
      <span className="text-sm flex-shrink-0 mt-0.5">{config.icon}</span>
      <p className="font-sans text-[10px] text-slateMid leading-relaxed">
        {config.text}
      </p>
    </div>
  );
}
