export const metadata = {
  title: "Home Physiotherapy FAQ — Costs, Conditions & Booking",
  description: "How much does home physiotherapy cost in Chandigarh? What conditions are treated at home? Are physios verified? Answers to every common question.",
};

const FAQS = [
  { q: "How much does home physiotherapy cost in Chandigarh?", a: "Sessions typically cost ₹700–₹900 depending on the treatment and your area. Multi-day packages (10 or 15 days) offer discounted rates." },
  { q: "Are the physiotherapists verified?", a: "Yes. Every physio submits a government ID and degree certificate, which our team manually verifies before their profile goes live. Unverified practitioners never appear on the platform." },
  { q: "What conditions are treated at home?", a: "Post-surgery rehabilitation, sports injuries, back and neck pain, sciatica, arthritis, stroke recovery and general mobility therapy." },
  { q: "Do I need a doctor's referral?", a: "Not for most musculoskeletal conditions. Your physiotherapist performs a full assessment on the first visit and coordinates with your doctor if needed." },
  { q: "How soon can a physiotherapist visit?", a: "Most patients get a same-day or next-day slot, depending on availability in their area." },
  { q: "How do recovery packages work?", a: "Packages like a 10-Day Post-Surgery Rehab bundle multiple sessions over a fixed period at a lower total price. Book the package and your first session is scheduled immediately." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <h1 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h1>
      <p className="mt-1 text-slate-600">Everything patients ask about home physiotherapy.</p>
      <div className="mt-8 max-w-2xl space-y-4">
        {FAQS.map((f, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow">
            <h2 className="font-semibold text-slate-900">{f.q}</h2>
            <p className="mt-2 text-sm text-slate-600">{f.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}