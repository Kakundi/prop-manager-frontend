// app/super-admin/tabs/FeatureFlagsTab.tsx
'use client';

import React, { useState } from 'react';
import { ToggleRight, ToggleLeft, Sliders, ShieldCheck } from 'lucide-react';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  min_tier: 'starter' | 'growth' | 'enterprise';
  enabled_globally: boolean;
}

export const FeatureFlagsTab: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      id: 'ff_1',
      key: 'whatsapp_bot_automation',
      name: 'WhatsApp Bot Integration',
      description: 'Allows tenants to query balances and download rent receipts via WhatsApp.',
      min_tier: 'growth',
      enabled_globally: true,
    },
    {
      id: 'ff_2',
      key: 'ai_emailer_module',
      name: 'AI Emailer & Dispute Summarizer',
      description: 'Uses AI to draft tenant payment reminders and summarize maintenance requests.',
      min_tier: 'enterprise',
      enabled_globally: true,
    },
    {
      id: 'ff_3',
      key: 'auto_mpesa_stk_push',
      name: 'Automated Monthly STK Push',
      description: 'Triggers automated M-Pesa STK push prompts on rent due date.',
      min_tier: 'growth',
      enabled_globally: false,
    },
  ]);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled_globally: !f.enabled_globally } : f))
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Feature Flags & Module Controls</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Enable or disable modular SaaS features globally or restrict them by subscription tier.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="divide-y divide-gray-100">
          {flags.map((flag) => (
            <div key={flag.id} className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{flag.name}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">
                    {flag.min_tier}+ Tier
                  </span>
                </div>
                <p className="text-xs text-gray-500">{flag.description}</p>
                <code className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                  {flag.key}
                </code>
              </div>

              <button onClick={() => toggleFlag(flag.id)} className="shrink-0">
                {flag.enabled_globally ? (
                  <ToggleRight size={38} className="text-amber-500" />
                ) : (
                  <ToggleLeft size={38} className="text-gray-300" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};