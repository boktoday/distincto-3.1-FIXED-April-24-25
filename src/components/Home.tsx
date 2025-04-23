import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, Wifi, BarChart2, Mic, Database } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Child development journaling for the privacy-conscious parent
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-600 max-w-3xl mx-auto">
            Privacy First - Fully Offline - AI-Powered Insights
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link 
              to="/journal" 
              className="px-6 py-3 bg-raspberry text-white font-medium rounded-lg shadow-md hover:bg-opacity-90 transition-all"
            >
              Get Started
            </Link>
            <a 
              href="#features" 
              className="px-6 py-3 bg-white text-raspberry border border-raspberry font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Learn More
            </a>
          </div>
          <div className="text-sm text-gray-500 flex justify-center space-x-6">
            <span className="flex items-center">
              <Wifi className="h-4 w-4 mr-1 text-gray-400" />
              Fully offline
            </span>
            <span className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-gray-400" />
              No data hostage
            </span>
            <span className="flex items-center">
              <Database className="h-4 w-4 mr-1 text-gray-400" />
              Your data, your control
            </span>
          </div>
        </div>
      </section>

      {/* App Screenshot */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="p-2 bg-gray-900 flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="p-4 bg-gray-800 text-white">
              <div className="flex">
                <div className="w-1/4 border-r border-gray-700 pr-4">
                  <div className="mb-4">
                    <h3 className="font-medium mb-2 text-gray-300">Journal Entries</h3>
                    <ul className="space-y-2">
                      <li className="px-3 py-2 bg-raspberry bg-opacity-20 rounded text-raspberry">First Steps</li>
                      <li className="px-3 py-2 hover:bg-gray-700 rounded">First Words</li>
                      <li className="px-3 py-2 hover:bg-gray-700 rounded">Daycare Day 1</li>
                      <li className="px-3 py-2 hover:bg-gray-700 rounded">Food Allergies</li>
                      <li className="px-3 py-2 hover:bg-gray-700 rounded">Growth Chart</li>
                    </ul>
                  </div>
                </div>
                <div className="w-3/4 pl-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-4">First Steps</h2>
                    <div className="text-gray-300">
                      <p className="mb-3">Today was a milestone! Emma took her first steps without holding onto anything. She managed three wobbly steps before sitting down with a proud smile.</p>
                      <p>She's been cruising along furniture for weeks, but this is the first time she's ventured out on her own. I can't believe how fast she's growing!</p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center text-sm text-gray-400">
                    <span className="mr-4">March 15, 2023</span>
                    <span className="mr-4">Milestone</span>
                    <span>12 months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start mb-4">
                <div className="bg-pink-50 p-3 rounded-lg mr-4">
                  <Shield className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Privacy First</h3>
              </div>
              <p className="text-gray-600">
                Your child's data stays on your device. No cloud storage, no data collection, no privacy concerns. distincto never sends your sensitive information anywhere.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start mb-4">
                <div className="bg-pink-50 p-3 rounded-lg mr-4">
                  <Wifi className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Fully Offline</h3>
              </div>
              <p className="text-gray-600">
                distincto works completely offline. Use it anywhere, anytime, without worrying about internet connectivity or data usage.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start mb-4">
                <div className="bg-pink-50 p-3 rounded-lg mr-4">
                  <BookOpen className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Comprehensive Journaling</h3>
              </div>
              <p className="text-gray-600">
                Track milestones, daily activities, food journeys, and more. Create a complete record of your child's development journey with rich text and media support.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start mb-4">
                <div className="bg-pink-50 p-3 rounded-lg mr-4">
                  <BarChart2 className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Insightful Reports</h3>
              </div>
              <p className="text-gray-600">
                Generate detailed reports and visualizations to understand patterns in your child's development, sleep, nutrition, and more.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start mb-4">
                <div className="bg-pink-50 p-3 rounded-lg mr-4">
                  <Mic className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Voice Recording</h3>
              </div>
              <p className="text-gray-600">
                Capture precious moments with voice recordings. Document your child's first words, songs, and stories directly in your journal entries.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start mb-4">
                <div className="bg-pink-50 p-3 rounded-lg mr-4">
                  <Database className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Local Data Ownership</h3>
              </div>
              <p className="text-gray-600">
                Export, backup, and manage your data however you want. Your journal entries are stored in standard formats that you can access anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <details className="group border-b pb-4">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                <span className="text-lg">How secure is my child's data?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3">
                Your data never leaves your device unless you explicitly export it. distincto uses local storage with optional encryption to keep your child's information completely private.
              </p>
            </details>

            <details className="group border-b pb-4">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                <span className="text-lg">Can I share entries with family members?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3">
                Yes! You can export individual entries or reports as PDFs to share with family members while maintaining control over your data.
              </p>
            </details>

            <details className="group border-b pb-4">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                <span className="text-lg">How do I backup my journal?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3">
                distincto provides easy export options to create backups of your entire journal. You can save these backups to your device or external storage for safekeeping.
              </p>
            </details>

            <details className="group border-b pb-4">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                <span className="text-lg">Does distincto work on all devices?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3">
                distincto is a web application that works on any modern browser. You can use it on desktops, laptops, tablets, and smartphones for convenient journaling anywhere.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Start documenting your child's journey today</h2>
          <p className="text-xl mb-8 opacity-90">
            Private, secure, and completely in your control.
          </p>
          <Link 
            to="/journal" 
            className="inline-block px-8 py-4 bg-white text-raspberry font-medium rounded-lg shadow-md hover:bg-gray-100 transition-all"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
