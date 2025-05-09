'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStyleGuideStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StyleGuideConfig, VersionHistory } from '@/types/style-guide';
import NaturalLanguageProcessor from '@/components/NaturalLanguageProcessor';

// Icons
import {
  SwatchIcon,
  DocumentTextIcon,
  ViewColumnsIcon,
  ArrowsPointingOutIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { config, setConfig, isLoading, setIsLoading, error, setError } = useStyleGuideStore();
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [stats, setStats] = useState({
    colorSchemes: 0,
    typographies: 0,
    components: 0,
    spacings: 0,
    images: 0,
    feedback: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. Using demo data.');

        // Set demo data for the dashboard
        const demoConfig: StyleGuideConfig = {
          id: 'demo-config',
          name: 'Demo Style Guide',
          description: 'This is a demo style guide with placeholder data. Configure Supabase to use real data.',
          version: '1.0.0',
          activeColorScheme: 'demo-color-scheme',
          activeTypography: 'demo-typography',
          activeSpacing: 'demo-spacing',
          activeBorderRadius: 'demo-border-radius',
          activeShadow: 'demo-shadow',
          activeAnimation: 'demo-animation',
          customFeatures: {
            customCursor: true,
            customScrollbar: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'demo-user',
        };

        const demoVersionHistory: VersionHistory[] = [
          {
            id: 'demo-version-1',
            styleGuideId: 'demo-config',
            version: '1.0.0',
            changes: 'Initial version',
            snapshot: {},
            createdAt: new Date().toISOString(),
            createdBy: 'demo-user',
          }
        ];

        const demoStats = {
          colorSchemes: 2,
          typographies: 1,
          components: 5,
          spacings: 1,
          images: 3,
          feedback: 2,
        };

        // Set the demo data in the store
        setConfig(demoConfig);
        setVersionHistory(demoVersionHistory);
        setStats(demoStats);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the active style guide config
        const { data: configData, error: configError } = await supabase
          .from('style_guide_configs')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (configError) {
          throw configError;
        }

        setConfig(configData as StyleGuideConfig);

        // Fetch version history
        const { data: versionData, error: versionError } = await supabase
          .from('version_histories')
          .select('*')
          .eq('style_guide_id', configData.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (versionError) {
          throw versionError;
        }

        setVersionHistory(versionData as VersionHistory[]);

        // Fetch stats
        const tables = [
          'color_schemes',
          'typographies',
          'components',
          'spacings',
          'images',
          'feedback',
        ];

        const statsPromises = tables.map(async (table) => {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.error(`Error fetching ${table} count:`, error);
            return { table, count: 0 };
          }

          return { table, count: count || 0 };
        });

        const statsResults = await Promise.all(statsPromises);
        const statsObject = statsResults.reduce((acc, { table, count }) => {
          const key = table.replace(/_/g, '') as keyof typeof stats;
          return { ...acc, [key]: count };
        }, {} as typeof stats);

        setStats(statsObject);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setConfig, setIsLoading, setError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h2 className="text-red-800 dark:text-red-200 text-lg font-medium">Error</h2>
        <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 px-4 py-2 rounded-md text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const quickLinks = [
    { name: 'Colors', href: '/admin/colors', icon: SwatchIcon, count: stats.colorSchemes },
    { name: 'Typography', href: '/admin/typography', icon: DocumentTextIcon, count: stats.typographies },
    { name: 'Components', href: '/admin/components', icon: ViewColumnsIcon, count: stats.components },
    { name: 'Spacing', href: '/admin/spacing', icon: ArrowsPointingOutIcon, count: stats.spacings },
    { name: 'Images', href: '/admin/images', icon: PhotoIcon, count: stats.images },
    { name: 'Feedback', href: '/admin/feedback', icon: ChatBubbleLeftRightIcon, count: stats.feedback },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>

      {!isSupabaseConfigured && (
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h2 className="text-yellow-800 dark:text-yellow-200 text-lg font-medium">Demo Mode</h2>
          <p className="text-yellow-700 dark:text-yellow-300 mt-1">
            You are currently viewing demo data. To use real data, please configure Supabase by updating the <code>.env.local</code> file with your Supabase URL and API key.
          </p>
        </div>
      )}

      {/* Style Guide Info */}
      <div className="mt-6 bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Style Guide Information</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Current active style guide configuration.
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200 sm:dark:divide-gray-700">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {config?.name || 'No style guide configured'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {config?.description || 'No description available'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {config?.version || 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {config?.updatedAt
                  ? new Date(config.updatedAt).toLocaleString()
                  : 'Never'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Links</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <div
              key={link.name}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <link.icon className="h-6 w-6 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {link.name}
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {link.count}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                <div className="text-sm">
                  <Link
                    href={link.href}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    View all
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Natural Language Command Processor */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Natural Language Commands</h2>
        <div className="mt-4">
          <NaturalLanguageProcessor
            onCommandExecuted={(result) => {
              console.log('Command executed:', result);
              // You could update the UI based on the result here
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {versionHistory.length > 0 ? (
              versionHistory.map((version) => (
                <li key={version.id} className="px-6 py-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Version {version.version}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {version.changes}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No recent activity
              </li>
            )}
          </ul>
          {versionHistory.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/settings"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  View all versions
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
