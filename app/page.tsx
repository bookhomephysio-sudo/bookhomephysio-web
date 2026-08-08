import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <img src="/logo.png" alt="BookHomePhysio" className="mx-auto mb-8 h-32 w-auto" />
        <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Expert Physiotherapy, <span className="text-teal-600">At Your Home</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Book verified physiotherapists for home visits. Post-surgery recovery, sports
          injuries, pain management — recovery happens best where you feel safest.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/physios" className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700">
            Find a Physio
          </Link>
          <Link href="/auth" className="rounded-xl bg-white px-6 py-3 font-semibold text-teal-700 shadow hover:bg-teal-50">
            I&apos;m a Physiotherapist
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "Choose your physio", text: "Browse verified professionals near you, compare specialties and reviews." },
            { step: "2", title: "Book a slot", text: "Pick a date and time that fits your day. They come to your home." },
            { step: "3", title: "Recover at home", text: "Get treated in comfort. Pay after your session (cash/UPI)." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl bg-white p-6 text-center shadow">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 font-bold text-white">
                {s.step}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 text-center sm:grid-cols-3">
          <p className="text-sm text-slate-600">✅ Verified licenses & certifications</p>
          <p className="text-sm text-slate-600">🏠 1-on-1 home sessions</p>
          <p className="text-sm text-slate-600">💵 Pay after your session</p>
        </div>
      </section>
    </main>
  );
}