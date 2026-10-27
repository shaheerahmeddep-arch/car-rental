import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-76px)] overflow-hidden">
      
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/car.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Red Gradient Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(200,16,46,0.35),transparent_45%)]"
      />

      {/* Content */}
      <div className="container relative z-10 flex min-h-[calc(100vh-76px)] items-center">
        <div className="max-w-[720px]">

<img
  src="/logo-1.png"
  alt="Shaheer Car Rental"
  className="mb-4  h-24 w-56 object-contain object-left sm:h-28 sm:w-64"
/>
          <p className="mb-3.5 inline-block text-[0.9rem] font-semibold text-accent opacity-0 animate-rise">
            Lahore, Pakistan
          </p>

          <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold text-white opacity-0 animate-rise [animation-delay:120ms]">
            Rent your perfect car,{' '}
            <span className="text-accent">
              right here in Lahore.
            </span>
          </h1>

          <p className="max-w-[560px] text-[1.08rem] text-white/80 opacity-0 animate-rise [animation-delay:240ms]">
            Welcome to Shaheer Car Rental System — your reliable car rental
            service in Lahore. Explore our vehicles, compare condition and
            availability, and book the car that fits your trip in a few minutes.
          </p>

          <div className="mt-7 mb-12 flex flex-wrap gap-4 opacity-0 animate-rise [animation-delay:360ms]">
            <Link
              to="/cars"
              className="btn btn-primary"
            >
              Browse Available Cars
            </Link>

            <Link
              to="/contact"
              className="btn btn-ghost text-white"
            >
              Visit Our Lahore Branch
            </Link>
          </div>

          <div className="flex flex-wrap gap-10 opacity-0 animate-rise [animation-delay:480ms]">

            <div className="flex flex-col">
              <strong className="font-display text-[1.5rem] text-accent">
                6+
              </strong>
              <span className="text-[0.85rem] text-white/70">
                Vehicle categories
              </span>
            </div>

            <div className="flex flex-col">
              <strong className="font-display text-[1.5rem] text-accent">
                24/7
              </strong>
              <span className="text-[0.85rem] text-white/70">
                Booking support
              </span>
            </div>

            <div className="flex flex-col">
              <strong className="font-display text-[1.5rem] text-accent">
                100%
              </strong>
              <span className="text-[0.85rem] text-white/70">
                Lahore-based service
              </span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}