// app/developer/tabs/FeatureFlagsTab.tsx
'use client';

import React, { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export const FeatureFlagsTab: React.FC = () => {
  const [flags, setFlags] = useState({
    mpesaAutoReconcile: true,
    whatsappBotAutomation: true,
    aiEmailerService: false,
    bulkSmsNotifications: true,
  });

  const toggle = (key: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">System Feature Flags</h2>
        <p className="text-xs text-gray-500">Enable or disable core system integrations globally or per tenant tier.</p>
      </div>

      <div className="divide-y divide-gray-100 text-xs">
        {Object.entries(flags).map(([key, enabled]) => (
          <div key={key} className="py-3.5 flex justify-between items-center">
            <div>
              <span className="font-bold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <p className="text-gray-500 text-[11px]">Controls platform availability for this module.</p>
            </div>
            <button onClick={() => toggle(key as keyof typeof flags)}>
              {enabled ? (
                <ToggleRight size={32} className="text-indigo-600" />
              ) : (
                <ToggleLeft size={32} className="text-gray-300" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};