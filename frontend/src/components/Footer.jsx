import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-elevated pt-14 pb-7">
      <div className="container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
        <div>
          <h3 className="text-[1.2rem]">Shaheer <span className="text-accent">Car Rental</span></h3>
          <p className="max-w-[260px] text-[0.92rem]">
            Reliable, well-maintained vehicles for every journey — based in Lahore, Pakistan.
          </p>
        </div>
        <div>
          <h4 className="text-[0.95rem]">Explore</h4>
          <ul className="flex list-none flex-col gap-2 p-0">
            <li><Link to="/cars">Browse Cars</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/my-bookings">My Bookings</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[0.95rem]">Contact</h4>
          <ul className="flex list-none flex-col gap-2 p-0 text-[0.92rem] text-ink-soft">
            <li>Lahore, Punjab, Pakistan</li>
            <li>0343 9205352</li>
            <li>shaheerahmed.dep@gmail.com</li>
          </ul>
        </div>
        <div>
          <h4 className="text-[0.95rem]">Hours</h4>
          <p className="text-[0.92rem]">Mon–Sun: 8:00 AM – 10:00 PM</p>
        </div>
      </div>
      <div className="container mt-10 border-t border-line pt-5 text-[0.82rem] text-ink-muted">
        © {new Date().getFullYear()} Shaheer Car Rental System. All rights reserved.
      </div>
    </footer>
  );
}
