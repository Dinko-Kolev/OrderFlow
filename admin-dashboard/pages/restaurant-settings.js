import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Clock, Calendar, Settings, Save, RefreshCw, Building2 } from 'lucide-react';

export default function RestaurantSettings() {
  const [workingHours, setWorkingHours] = useState([]);
  const [reservationConfig, setReservationConfig] = useState({});
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('working-hours');

  useEffect(() => {
    fetchRestaurantSettings();
  }, []);

  const fetchRestaurantSettings = async () => {
    try {
      setLoading(true);
      // Fetch working hours
      const hoursResponse = await fetch('http://localhost:3003/api/admin/restaurant/working-hours');
      const hoursData = await hoursResponse.json();
      if (hoursData.success) {
        setWorkingHours(hoursData.data);
      }

      // Fetch reservation configuration
      const configResponse = await fetch('http://localhost:3003/api/admin/restaurant/config');
      const configData = await configResponse.json();
      if (configData.success) {
        setReservationConfig(configData.data);
      }

      // Fetch policies
      const policiesResponse = await fetch('http://localhost:3003/api/admin/restaurant/policies');
      const policiesData = await policiesResponse.json();
      if (policiesData.success) {
        setPolicies(policiesData.data);
      }
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
      if (window.showToast) {
        window.showToast('Failed to load restaurant settings', 'error', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateWorkingHours = async (dayOfWeek, updates) => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/restaurant/working-hours/${dayOfWeek}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        if (window.showToast) {
          window.showToast('Working hours updated successfully', 'success', 2000);
        }
        fetchRestaurantSettings(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating working hours:', error);
      if (window.showToast) {
        window.showToast('Failed to update working hours', 'error', 4000);
      }
    }
  };

  const updateReservationConfig = async (key, value) => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/restaurant/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_key: key, config_value: value })
      });
      
      if (response.ok) {
        if (window.showToast) {
          window.showToast('Configuration updated successfully', 'success', 2000);
        }
        fetchRestaurantSettings(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      if (window.showToast) {
        window.showToast('Failed to update configuration', 'error', 4000);
      }
    }
  };

  const updatePolicy = async (policyName, value, isActive) => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/restaurant/policies/${policyName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_value: value, is_active: isActive })
      });
      
      if (response.ok) {
        if (window.showToast) {
          window.showToast('Policy updated successfully', 'success', 2000);
        }
        fetchRestaurantSettings(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      if (window.showToast) {
        window.showToast('Failed to update policy', 'error', 4000);
      }
    }
  };

  const handleWorkingHoursChange = (dayOfWeek, field, value) => {
    const updatedHours = workingHours.map(day => 
      day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day
    );
    setWorkingHours(updatedHours);
  };

  const handleConfigChange = (key, value) => {
    setReservationConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePolicyChange = (policyName, field, value) => {
    const updatedPolicies = policies.map(policy => 
      policy.policy_name === policyName ? { ...policy, [field]: value } : policy
    );
    setPolicies(updatedPolicies);
  };

  const saveWorkingHours = async (dayOfWeek) => {
    const day = workingHours.find(d => d.day_of_week === dayOfWeek);
    if (day) {
      await updateWorkingHours(dayOfWeek, day);
    }
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      // Save working hours
      for (const day of workingHours) {
        await updateWorkingHours(day.day_of_week, day);
      }

      // Save reservation config
      for (const [key, value] of Object.entries(reservationConfig)) {
        await updateReservationConfig(key, value);
      }

      // Save policies
      for (const policy of policies) {
        await updatePolicy(policy.policy_name, policy.policy_value, policy.is_active);
      }

      if (window.showToast) {
        window.showToast('All changes saved successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      if (window.showToast) {
        window.showToast('Failed to save some changes', 'error', 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading restaurant settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Restaurant Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure your restaurant's working hours, reservation policies, and operational settings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('working-hours')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'working-hours'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Working Hours
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reservations'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Reservation Settings
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'policies'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Policies
          </button>
        </div>

        {/* Working Hours Tab */}
        {activeTab === 'working-hours' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Working Hours Configuration
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set your restaurant's operating hours for each day of the week.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workingHours.map((day) => (
                    <div key={day.day_of_week} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={day.is_open}
                            onCheckedChange={(checked) => 
                              handleWorkingHoursChange(day.day_of_week, 'is_open', checked)
                            }
                          />
                          <h3 className="font-semibold text-lg">{day.day_name}</h3>
                          <Badge variant={day.is_open ? 'default' : 'secondary'}>
                            {day.is_open ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => saveWorkingHours(day.day_of_week)}
                          className="ml-auto"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>

                      {day.is_open && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">General Hours</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="time"
                                value={day.open_time || ''}
                                onChange={(e) => 
                                  handleWorkingHoursChange(day.day_of_week, 'open_time', e.target.value)
                                }
                                className="flex-1"
                              />
                              <span className="text-gray-500 self-center">to</span>
                              <Input
                                type="time"
                                value={day.close_time || ''}
                                onChange={(e) => 
                                  handleWorkingHoursChange(day.day_of_week, 'close_time', e.target.value)
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Lunch Service</Label>
                            <div className="flex items-center gap-2 mt-2 mb-2">
                              <Switch
                                checked={day.is_lunch_service}
                                onCheckedChange={(checked) => 
                                  handleWorkingHoursChange(day.day_of_week, 'is_lunch_service', checked)
                                }
                              />
                              <span className="text-sm text-gray-600">Enable lunch service</span>
                            </div>
                            {day.is_lunch_service && (
                              <div className="flex gap-2">
                                <Input
                                  type="time"
                                  value={day.lunch_start || ''}
                                  onChange={(e) => 
                                    handleWorkingHoursChange(day.day_of_week, 'lunch_start', e.target.value)
                                  }
                                  className="flex-1"
                                />
                                <span className="text-gray-500 self-center">to</span>
                                <Input
                                  type="time"
                                  value={day.lunch_end || ''}
                                  onChange={(e) => 
                                    handleWorkingHoursChange(day.day_of_week, 'lunch_end', e.target.value)
                                  }
                                  className="flex-1"
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Dinner Service</Label>
                            <div className="flex items-center gap-2 mt-2 mb-2">
                              <Switch
                                checked={day.is_dinner_service}
                                onCheckedChange={(checked) => 
                                  handleWorkingHoursChange(day.day_of_week, 'is_dinner_service', checked)
                                }
                              />
                              <span className="text-sm text-gray-600">Enable dinner service</span>
                            </div>
                            {day.is_dinner_service && (
                              <div className="flex gap-2">
                                <Input
                                  type="time"
                                  value={day.dinner_start || ''}
                                  onChange={(e) => 
                                    handleWorkingHoursChange(day.day_of_week, 'dinner_start', e.target.value)
                                  }
                                  className="flex-1"
                                />
                                <span className="text-gray-500 self-center">to</span>
                                <Input
                                  type="time"
                                  value={day.dinner_end || ''}
                                  onChange={(e) => 
                                    handleWorkingHoursChange(day.day_of_week, 'dinner_end', e.target.value)
                                  }
                                  className="flex-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reservation Settings Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reservation Configuration
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure reservation duration, time slots, and operational parameters.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="duration">Reservation Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={reservationConfig.reservation_duration_minutes || ''}
                        onChange={(e) => handleConfigChange('reservation_duration_minutes', e.target.value)}
                        placeholder="105"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total time including dining and buffer (e.g., 90 dining + 15 buffer = 105)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="grace">Grace Period (minutes)</Label>
                      <Input
                        id="grace"
                        type="number"
                        value={reservationConfig.grace_period_minutes || ''}
                        onChange={(e) => handleConfigChange('grace_period_minutes', e.target.value)}
                        placeholder="15"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How late customers can arrive without penalty
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="maxSitting">Max Sitting Time (minutes)</Label>
                      <Input
                        id="maxSitting"
                        type="number"
                        value={reservationConfig.max_sitting_minutes || ''}
                        onChange={(e) => handleConfigChange('max_sitting_minutes', e.target.value)}
                        placeholder="120"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum time customers can stay at a table
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="interval">Time Slot Interval (minutes)</Label>
                      <Input
                        id="interval"
                        type="number"
                        value={reservationConfig.time_slot_interval_minutes || ''}
                        onChange={(e) => handleConfigChange('time_slot_interval_minutes', e.target.value)}
                        placeholder="30"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Interval between available reservation times
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="advance">Advance Booking (days)</Label>
                      <Input
                        id="advance"
                        type="number"
                        value={reservationConfig.advance_booking_days || ''}
                        onChange={(e) => handleConfigChange('advance_booking_days', e.target.value)}
                        placeholder="30"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How many days in advance customers can book
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sameDay">Same Day Booking (hours)</Label>
                      <Input
                        id="sameDay"
                        type="number"
                        value={reservationConfig.same_day_booking_hours || ''}
                        onChange={(e) => handleConfigChange('same_day_booking_hours', e.target.value)}
                        placeholder="2"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Hours before service when same-day bookings are allowed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button onClick={saveAllChanges} disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Reservation Policies
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure business policies and rules for reservations.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.policy_name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold capitalize">
                            {policy.policy_name.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {policy.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {policy.policy_name.includes('allow_') || policy.policy_name.includes('require_') ? (
                            <Switch
                              checked={policy.policy_value === 'true'}
                              onCheckedChange={(checked) => 
                                handlePolicyChange(policy.policy_name, 'policy_value', checked.toString())
                              }
                            />
                          ) : (
                            <Input
                              type={policy.policy_name.includes('amount') ? 'number' : 'text'}
                              value={policy.policy_value}
                              onChange={(e) => 
                                handlePolicyChange(policy.policy_name, 'policy_value', e.target.value)
                              }
                              className="w-32"
                            />
                          )}
                          <Button
                            size="sm"
                            onClick={() => updatePolicy(policy.policy_name, policy.policy_value, policy.is_active)}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={policy.is_active}
                          onCheckedChange={(checked) => 
                            handlePolicyChange(policy.policy_name, 'is_active', checked)
                          }
                        />
                        <span className="text-sm text-gray-600">
                          Policy is {policy.is_active ? 'active' : 'inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={fetchRestaurantSettings}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset to defaults
                    if (window.showToast) {
                      window.showToast('Reset to defaults functionality coming soon', 'info', 3000);
                    }
                  }}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Export settings
                    if (window.showToast) {
                      window.showToast('Export functionality coming soon', 'info', 3000);
                    }
                  }}
                >
                  Export Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
