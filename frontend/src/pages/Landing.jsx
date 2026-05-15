import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                Gather feedback effortlessly
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Create engaging polls, gather feedback, and make data-driven decisions. With real-time analytics and intuitive design.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <Link
                to={user ? '/dashboard' : '/login'}
                className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 text-center text-lg"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Link>
              <a
                href="#features"
                className="px-10 py-5 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold hover:border-slate-900 dark:hover:border-white transition-all duration-300 text-center text-lg"
              >
                Learn More
              </a>
            </div>

            <div className="flex gap-12 pt-8">
              <div>
                <div className="text-4xl font-bold text-slate-900 dark:text-white">1000+</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Polls Created</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 dark:text-white">50k+</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Responses</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 dark:text-white">24/7</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Live Analytics</p>
              </div>
            </div>
          </div>

          {/* Hero Image - Interactive Dashboard Preview */}
          <div className="hidden lg:flex items-center justify-center relative">
            {/* Glowing background orbs */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 via-purple-200/20 to-pink-200/30 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-3xl blur-3xl opacity-60"></div>
            
            {/* Main card container */}
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-800 dark:to-dark-700 rounded-3xl overflow-hidden border border-blue-100 dark:border-dark-600 shadow-2xl">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-40"></div>
              
              {/* Content container */}
              <div className="relative h-full p-10 flex flex-col justify-between">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Live Poll Results</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Updated in real-time</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                  </div>
                </div>

                {/* Chart visualization */}
                <div className="space-y-5 flex-1 flex flex-col justify-center">
                  {/* Bar 1 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Excellent</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">45%</span>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                    </div>
                  </div>

                  {/* Bar 2 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Good</span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">32%</span>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full w-[32%] bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    </div>
                  </div>

                  {/* Bar 3 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Average</span>
                      <span className="text-sm font-bold text-pink-600 dark:text-pink-400">18%</span>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full w-[18%] bg-gradient-to-r from-pink-500 to-pink-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>

                  {/* Bar 4 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Poor</span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">5%</span>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full w-[5%] bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                    </div>
                  </div>
                </div>

                {/* Footer stats */}
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 pt-6 border-t border-slate-200 dark:border-dark-600">
                  <span>1,247 responses</span>
                  <span>Last updated 2s ago</span>
                </div>
              </div>
            </div>

            {/* Floating accent card */}
            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-dark-900 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-dark-700 w-48 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Instant Insights</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">See patterns instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 dark:bg-dark-800 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Powerful features
            </h2>
            <p className="text-2xl text-slate-600 dark:text-slate-400">
              Everything you need to create and manage polls effectively
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-dark-900 p-10 rounded-2xl border border-slate-200 dark:border-dark-700 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center mb-8">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Real-time Analytics
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Watch responses come in live with instant, beautiful visualizations of your poll results.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-dark-900 p-10 rounded-2xl border border-slate-200 dark:border-dark-700 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center mb-8">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Secure & Private
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Your polls and responses are protected with industry-standard security and encryption.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-dark-900 p-10 rounded-2xl border border-slate-200 dark:border-dark-700 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center mb-8">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Easy to Use
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Intuitive interface makes creating professional polls quick and effortless.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-dark-900 p-10 rounded-2xl border border-slate-200 dark:border-dark-700 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center mb-8">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Shareable Links
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Share poll links easily with anyone. Works perfectly on mobile and desktop devices.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-dark-900 p-10 rounded-2xl border border-slate-200 dark:border-dark-700 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center mb-8">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Smart Insights
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Get actionable insights from your poll data with advanced analytics and reporting.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-dark-900 p-10 rounded-2xl border border-slate-200 dark:border-dark-700 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center mb-8">
                <span className="text-2xl">🌙</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Light & Dark Mode
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Choose your preferred theme. Automatic dark mode respects your system settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white dark:bg-dark-900 py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-8">
            Ready to get started?
          </h2>
          <p className="text-2xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            Create your first poll in seconds and start gathering feedback from your audience.
          </p>
          <Link
            to={user ? '/create' : '/login'}
            className="inline-block px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 text-lg"
          >
            {user ? 'Create a Poll' : 'Sign Up Free'}
          </Link>
        </div>
      </section>
    </div>
  );
}
