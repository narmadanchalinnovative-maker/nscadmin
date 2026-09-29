'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <p className="text-gray-200">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-20">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="space-y-12">
          <div className="text-center space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Welcome to Admin Panel
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Production-ready admin dashboard for managing events, batches, courses, and tests with Firebase authentication and Firestore.
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <Link
                href="/login"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="px-8 py-3 border-2 border-blue-600 text-blue-400 rounded-lg font-semibold hover:bg-blue-600/10 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Features Section */}
          <section id="features" className="grid md:grid-cols-3 gap-8 pt-20 border-t border-gray-700">
            {[
              {
                title: 'Easy Authentication',
                description: 'Email and password login with role-based access control',
              },
              {
                title: 'Full CRUD Operations',
                description: 'Create, read, update, and delete items seamlessly',
              },
              {
                title: 'Real-time Sync',
                description: 'Firestore integration for instant data synchronization',
              },
              {
                title: 'Responsive Design',
                description: 'Mobile-friendly admin dashboard with Tailwind CSS',
              },
              {
                title: 'Search & Filter',
                description: 'Powerful search and filtering capabilities',
              },
              {
                title: 'Status Management',
                description: 'Easy toggle between active and inactive states',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-600 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </section>

          {/* Tech Stack */}
          <section className="bg-slate-800/50 rounded-lg border border-slate-700 p-8 space-y-6">
            <h3 className="text-2xl font-bold text-white">Tech Stack</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-400 mb-3">Frontend</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>✓ Next.js 15+</li>
                  <li>✓ TypeScript</li>
                  <li>✓ Tailwind CSS</li>
                  <li>✓ React Hook Form</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-3">Backend & Database</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>✓ Firebase Auth (Email/Password)</li>
                  <li>✓ Cloud Firestore</li>
                  <li>✓ Zod Validation</li>
                  <li>✓ TanStack Table</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center space-y-4 py-12">
            <p className="text-gray-400">Ready to manage your content?</p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
