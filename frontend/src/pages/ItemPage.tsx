import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link } from '../components/Link';

export default function ItemPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Browse
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div>
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xl">
                {'{{ product_image_full }}'}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {'{{ furniture_title }}'}
              </h1>

              <div className="mb-6">
                <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                  {'{{ condition }}'}
                </span>
              </div>

              <p className="text-4xl font-bold text-emerald-600 mb-6">
                {'{{ price }}'}
              </p>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">
                  {'{{ description }}'}
                </p>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">{'{{ category }}'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Dimensions</span>
                  <span className="font-medium text-gray-900">{'{{ dimensions }}'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium text-gray-900">{'{{ location }}'}</span>
                </div>
              </div>

              <button className="w-full bg-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                <ShoppingCart size={24} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

