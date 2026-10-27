import React from 'react';
import useReveal from './useReveal';

const STEPS = [
  { step: '1', title: 'Browse & compare', text: 'Explore vehicles by category, price and condition until you find the right fit.' },
  { step: '2', title: 'Pick your dates', text: 'Choose your pickup and return date and time — we check availability instantly.' },
  { step: '3', title: 'Confirm & pay', text: 'Enter your details, choose a payment method, and submit your booking.' },
  { step: '4', title: 'Pick up in Lahore', text: 'Collect your car from our Lahore location at the time you booked.' },
];

export default function HowItWorks() {
  const ref = useReveal();
  return (
    <section className="section section-dark">
      <div className="container">
        <div className="section-head">
          <h2>How it works</h2>
          <p>From browsing to driving off, the process takes just a few minutes.</p>
        </div>
        <div ref={ref} className="reveal grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[22px]">
          {STEPS.map((s) => (
            <div key={s.step} className="relative pl-1">
              <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-full bg-accent font-display font-bold text-white">{s.step}</div>
              <h3 className="mb-1.5 text-[1.02rem]">{s.title}</h3>
              <p className="text-[0.9rem]">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
