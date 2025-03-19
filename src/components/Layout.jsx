import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-800">
                  Questionnaire App
                </Link>
              </div> */}
              <div className="flex">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-2xl font-medium"
                >
                  Catalog
                </Link>
                {/* <Link
                  to="/create"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-2xl font-medium m-50"
                >
                  Create
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 