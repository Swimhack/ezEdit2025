'use client';

import React, { useState, useEffect } from 'react';

interface NotificationChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationPreference {
  id?: string;
  notificationType: string;
  enabled: boolean;
  channels: NotificationChannel;
  frequency: 'INSTANT' | 'BATCHED_5MIN' | 'BATCHED_HOURLY' | 'DAILY_DIGEST';
}

const notificationTypes = [
  {
    type: 'system_alert',
    label: 'System Alerts',
    description: 'Critical system issues and maintenance notifications',
    canDisable: false,
  },
  {
    type: 'security_notification',
    label: 'Security Notifications',
    description: 'Login attempts, password changes, and security alerts',
    canDisable: false,
  },
  {
    type: 'project_update',
    label: 'Project Updates',
    description: 'Updates on your projects and collaborations',
    canDisable: true,
  },
  {
    type: 'comment_reply',
    label: 'Comment Replies',
    description: 'Replies to your comments and mentions',
    canDisable: true,
  },
];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize with default preferences
  useEffect(() => {
    const defaultPreferences = notificationTypes.map(type => ({
      notificationType: type.type,
      enabled: true,
      channels: { email: true, sms: false, push: true, inApp: true },
      frequency: 'INSTANT' as const,
    }));
    setPreferences(defaultPreferences);
  }, []);

  const updateChannel = (type: string, channel: keyof NotificationChannel, enabled: boolean) => {
    setPreferences(prev => prev.map(pref =>
      pref.notificationType === type
        ? { ...pref, channels: { ...pref.channels, [channel]: enabled } }
        : pref
    ));
  };

  const updateEnabled = (type: string, enabled: boolean) => {
    setPreferences(prev => prev.map(pref =>
      pref.notificationType === type ? { ...pref, enabled } : pref
    ));
  };

  const updateFrequency = (type: string, frequency: NotificationPreference['frequency']) => {
    setPreferences(prev => prev.map(pref =>
      pref.notificationType === type ? { ...pref, frequency } : pref
    ));
  };

  const savePreferences = async () => {
    setSaving(true);
    // Mock save operation
    setTimeout(() => {
      setSaving(false);
      alert('Notification preferences saved successfully!');
    }, 1000);
  };

  const getPreference = (type: string) => {
    return preferences.find(p => p.notificationType === type) || {
      notificationType: type,
      enabled: true,
      channels: { email: false, sms: false, push: false, inApp: false },
      frequency: 'INSTANT' as const,
    };
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-gray-600">Manage how and when you receive notifications</p>
        </div>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Global Quiet Hours */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">Quiet Hours</h2>
        <p className="text-gray-600 mb-4">Set global quiet hours to reduce non-critical notifications</p>

        <div className="flex items-center mb-4">
          <input type="checkbox" id="quiet-hours" className="mr-2" />
          <label htmlFor="quiet-hours">Enable quiet hours</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input type="time" className="w-full p-2 border rounded" defaultValue="22:00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input type="time" className="w-full p-2 border rounded" defaultValue="08:00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <select className="w-full p-2 border rounded">
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        {notificationTypes.map((notifType) => {
          const preference = getPreference(notifType.type);

          return (
            <div key={notifType.type} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{notifType.label}</h3>
                  <p className="text-gray-600">{notifType.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                    Test
                  </button>
                  {notifType.canDisable && (
                    <input
                      type="checkbox"
                      checked={preference.enabled}
                      onChange={(e) => updateEnabled(notifType.type, e.target.checked)}
                    />
                  )}
                </div>
              </div>

              {preference.enabled && (
                <div className="space-y-4">
                  {/* Delivery Channels */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Delivery Channels</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preference.channels.email}
                          onChange={(e) => updateChannel(notifType.type, 'email', e.target.checked)}
                          className="mr-2"
                        />
                        Email
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preference.channels.sms}
                          onChange={(e) => updateChannel(notifType.type, 'sms', e.target.checked)}
                          className="mr-2"
                        />
                        SMS
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preference.channels.push}
                          onChange={(e) => updateChannel(notifType.type, 'push', e.target.checked)}
                          className="mr-2"
                        />
                        Push
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preference.channels.inApp}
                          onChange={(e) => updateChannel(notifType.type, 'inApp', e.target.checked)}
                          className="mr-2"
                        />
                        In-App
                      </label>
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Frequency</label>
                    <select
                      value={preference.frequency}
                      onChange={(e) => updateFrequency(notifType.type, e.target.value as NotificationPreference['frequency'])}
                      className="w-full p-2 border rounded"
                    >
                      <option value="INSTANT">Instant</option>
                      <option value="BATCHED_5MIN">Every 5 minutes</option>
                      <option value="BATCHED_HOURLY">Hourly</option>
                      <option value="DAILY_DIGEST">Daily digest</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mt-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total notification types:</span>
            <span>{notificationTypes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Enabled types:</span>
            <span>{preferences.filter(p => p.enabled).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Email notifications:</span>
            <span>{preferences.filter(p => p.enabled && p.channels.email).length}</span>
          </div>
          <div className="flex justify-between">
            <span>SMS notifications:</span>
            <span>{preferences.filter(p => p.enabled && p.channels.sms).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}