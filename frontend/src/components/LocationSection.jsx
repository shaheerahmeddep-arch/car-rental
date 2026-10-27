import React from 'react';

const MAP_QUERY = '31.4753842,74.2389528';
const MAPS_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;
const MAPS_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY}&z=16&output=embed`;

export default function LocationSection() {
  return (
    <section className="section section-dark">
      <div className="container grid grid-cols-1 items-center gap-10 sm:grid-cols-2">
        <div>
          <div className="section-head mb-5">
            <h2>Find us in Lahore</h2>
            <p>
              Shaheer Car Rental System operates out of Thokar Niaz Baig, Lahore — easy to reach for
              pickup and drop-off, with vehicles ready for trips across the region.
            </p>
          </div>
          <ul className="flex list-none flex-col gap-3 p-0 text-[0.95rem]">
            <li>
              📍{' '}
              <a
                href={MAPS_OPEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 transition-colors duration-[180ms] hover:text-accent-strong"
              >
                Main Branch, Thokar Niaz Baig, Lahore, Punjab, Pakistan
              </a>
            </li>
            <li>📞 0343 9205352</li>
            <li>🕒 Open daily, 8:00 AM – 10:00 PM</li>
          </ul>
          <a
            href={MAPS_OPEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-6"
          >
            Open in Google Maps →
          </a>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-[22px] border border-line">
          <iframe
            title="Shaheer Car Rental System location in Thokar Niaz Baig, Lahore, Pakistan"
            src={MAPS_EMBED_URL}
            width="100%"
            height="100%"
            className="border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
