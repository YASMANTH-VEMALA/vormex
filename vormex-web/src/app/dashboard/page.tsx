'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-neutral-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md dark:shadow-neutral-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Welcome, {user?.name}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Email: {user?.email}</p>
                {user?.college && (
                  <p className="text-gray-600 dark:text-gray-400">College: {user.college}</p>
                )}
                {user?.branch && (
                  <p className="text-gray-600 dark:text-gray-400">Branch: {user.branch}</p>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  Email Verified: {user?.isVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

