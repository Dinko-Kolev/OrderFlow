import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '../contexts/ThemeContext';
import Navigation from '../components/Navigation';
import { Settings as SettingsIcon, Database, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <Navigation />
      
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Configure your restaurant management system</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">System Settings</CardTitle>
            <CardDescription className="dark:text-gray-400">Coming soon - System configuration and preferences</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <SettingsIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Settings & Configuration</h3>
            <p className="text-gray-500 dark:text-gray-400">This feature is under development</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
