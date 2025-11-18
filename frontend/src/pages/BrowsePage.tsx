import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Furniture</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search furniture..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
              <option>Category</option>
              <option>Desks</option>
              <option>Chairs</option>
              <option>Beds</option>
              <option>Storage</option>
            </select>

            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>

            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
              <option>Condition</option>
              <option>Like New</option>
              <option>Good</option>
              <option>Fair</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-400">
                {'{{ product_image }}'}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {'{{ furniture_name }}'}
                </h3>
                <p className="text-emerald-600 font-bold text-lg mb-4">
                  {'{{ price }}'}
                </p>
                <a
                  href="/item"
                  className="block w-full text-center bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  View Item
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2">
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg">1</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">2</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">3</button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

