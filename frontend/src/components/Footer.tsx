import { Link } from './Link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Campus ReHome</h3>
            <p className="text-sm leading-relaxed">
              Sustainable furniture for students. Find quality used furniture at affordable prices.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/browse" className="text-sm hover:text-emerald-400 transition-colors">
                  Browse
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-emerald-400 transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: info@campusrehome.com</li>
              <li>Phone: (555) 123-4567</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-sm">
            © 2025 Campus ReHome. All rights reserved. Sustainable furniture for students.
          </p>
        </div>
      </div>
    </footer>
  );
}

