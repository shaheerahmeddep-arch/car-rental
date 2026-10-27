import React from 'react';
import useReveal from './useReveal';

const POINTS = [
  { title: 'Real-time availability', text: 'See exactly which cars are free for your dates — no overbooking, no surprises.' },
  { title: 'Transparent condition reports', text: 'Every vehicle lists its real exterior and interior condition, with photos to match.' },
  { title: 'Flexible payment options', text: 'Pay by cash, bank transfer, JazzCash or EasyPaisa — whatever works for you.' },
  { title: 'Local Lahore support', text: 'Based right here in Lahore, so pickup, drop-off and support are always close by.' },
];

export default function WhyChooseUs() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Why choose Shaheer Car Rental System</h2>
          <p>Built around clarity and trust — you always know what you're renting and when it's ready.</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[22px]">
          {POINTS.map((p) => <PointCard key={p.title} point={p} />)}
        </div>
      </div>
    </section>
  );
}

function PointCard({ point }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="card reveal p-6">
      <h3 className="mb-2 text-[1.05rem]">{point.title}</h3>
      <p className="m-0 text-[0.92rem]">{point.text}</p>
    </div>
  );
}
