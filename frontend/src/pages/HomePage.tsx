import { ArrowRight, DollarSign, Recycle, Truck } from 'lucide-react';
import { Link } from '../components/Link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Campus ReHome
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find quality used furniture perfect for your dorm or apartment.
            Buy sustainably, save money, and furnish your space with ease.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Browse Furniture
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Affordable Prices
              </h3>
              <p className="text-gray-600">
                Quality furniture at student-friendly prices. Save hundreds compared to buying new.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Recycle className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sustainable Reuse
              </h3>
              <p className="text-gray-600">
                Reduce waste and support a circular economy. Give furniture a second life.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Easy Pick-up & Delivery
              </h3>
              <p className="text-gray-600">
                Convenient options to get your furniture to your door.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

