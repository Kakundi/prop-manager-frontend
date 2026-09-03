// app/developer/tabs/ApiLogsTab.tsx
'use client';

import React from 'react';
import { Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export const ApiLogsTab: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">REST API & Webhook Stream</h2>
          <p className="text-xs text-slate-400">Real-time inspection of inbound M-Pesa callbacks & internal API calls.</p>
        </div>
        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono text-xs">
          Listening...
        </span>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
        <div className="flex items-center gap-3 text-emerald-400">
          <span>[POST 200]</span>
          <span className="text-slate-400">/api/v1/mpesa/c2b/callback</span>
          <span className="ml-auto text-slate-500">12ms</span>
        </div>
        <div className="flex items-center gap-3 text-indigo-400">
          <span>[GET 200]</span>
          <span className="text-slate-400">/marketer/api/users</span>
          <span className="ml-auto text-slate-500">45ms</span>
        </div>
      </div>
    </div>
  );
};