import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import WhyChooseUs from '../components/WhyChooseUs';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import LocationSection from '../components/LocationSection';
import ContactSection from '../components/ContactSection';
import CarCard from '../components/CarCard';
import api from '../services/api';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCars({ ordering: '-created_at' })
      .then((data) => setFeatured((data.results || data).slice(0, 3)))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Hero />

      <section className="section">
        <div className="container">
          <div className="section-head flex max-w-none items-end justify-between">
            <div>
              <h2>Featured vehicles</h2>
              <p>A snapshot of what's ready to book right now.</p>
            </div>
            <Link to="/cars" className="btn btn-ghost">View all cars</Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[430px]" />)
              : featured.map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        </div>
      </section>

      <CategoryGrid />
      <WhyChooseUs />
      <HowItWorks />
      <Testimonials />
      <LocationSection />
      <ContactSection />
    </>
  );
}
