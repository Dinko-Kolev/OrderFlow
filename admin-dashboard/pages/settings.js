import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Globe,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  });
  const [autoSave, setAutoSave] = useState(true);
  const [dataRetention, setDataRetention] = useState(365);

  const handleSaveSettings = () => {
    if (window.showToast) {
      window.showToast('Settings saved successfully', 'success', 3000);
    }
  };

  const handleResetSettings = () => {
    if (window.showToast) {
      window.showToast('Settings reset to defaults', 'info', 3000);
    }
  };

  const handleExportData = () => {
    if (window.showToast) {
      window.showToast('Data export started', 'info', 3000);
    }
  };

  const handleImportData = () => {
    if (window.showToast) {
      window.showToast('Data import started', 'info', 3000);
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Configure your restaurant management system
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleResetSettings}
                  className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appearance Settings */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    <span>Appearance</span>
                  </CardTitle>
                  <CardDescription>Customize the look and feel of your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Button
                      variant={isDarkMode ? "default" : "outline"}
                      onClick={toggleTheme}
                      className="min-w-[80px]"
                    >
                      {isDarkMode ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-save">Auto-save</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically save changes as you work
                      </p>
                    </div>
                    <Button
                      variant={autoSave ? "default" : "outline"}
                      onClick={() => setAutoSave(!autoSave)}
                      className="min-w-[80px]"
                    >
                      {autoSave ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <span>Notifications</span>
                  </CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <Button
                      variant={notifications.email ? "default" : "outline"}
                      onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                      className="min-w-[80px]"
                    >
                      {notifications.email ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Button
                      variant={notifications.push ? "default" : "outline"}
                      onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                      className="min-w-[80px]"
                    >
                      {notifications.push ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Button
                      variant={notifications.sms ? "default" : "outline"}
                      onClick={() => setNotifications(prev => ({ ...prev, sms: !prev.sms }))}
                      className="min-w-[80px]"
                    >
                      {notifications.sms ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <span>Data Management</span>
                  </CardTitle>
                  <CardDescription>Manage your data and backups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="data-retention">Data Retention (days)</Label>
                    <Input
                      id="data-retention"
                      type="number"
                      value={dataRetention}
                      onChange={(e) => setDataRetention(parseInt(e.target.value))}
                      min="30"
                      max="1095"
                      className="w-32"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      How long to keep order and customer data
                    </p>
                  </div>
                  <Separator />
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleExportData}
                      className="flex-1 border-green-200 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleImportData}
                      className="flex-1 border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions & Info */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5 text-orange-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Security Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Language & Region
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Database Settings
                  </Button>
                </CardContent>
              </Card>

              {/* System Info */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="font-medium">Today</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription className="text-red-500 dark:text-red-400">
                    Irreversible actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
