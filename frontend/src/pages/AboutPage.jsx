import React from 'react';

export default function AboutPage() {
  return (
    <div className="container section max-w-[760px]">
      <h1>About Shaheer Car Rental System</h1>
      <p>
        Shaheer Car Rental System is a locally run car rental service based in Lahore, Punjab.
        We maintain a growing fleet of sedans, SUVs, pickups and luxury vehicles, each listed
        with real photos, an honest condition report, and live availability based on actual
        bookings — never a hard-coded "always available" claim.
      </p>
      <p>
        Our goal is simple: make it easy to find, compare and book the right vehicle for your
        trip around Lahore and beyond, with flexible payment options and a straightforward
        booking process from start to finish.
      </p>
      <h2 className="mt-8 text-[1.3rem]">What we offer</h2>
      <ul>
        <li>A wide range of vehicle categories, added and managed by our team</li>
        <li>Multiple photos per car, including exterior and interior angles</li>
        <li>Real-time availability checks that prevent double booking</li>
        <li>Flexible payment methods: cash, bank transfer, JazzCash, EasyPaisa</li>
      </ul>
    </div>
  );
}
