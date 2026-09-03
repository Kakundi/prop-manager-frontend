// app/super-admin/tabs/WebhookDebuggerTab.tsx
'use client';

import React, { useState } from 'react';
import { RotateCw, AlertOctagon, Code2 } from 'lucide-react';
import { FailedWebhook } from '../types';

export const WebhookDebuggerTab: React.FC = () => {
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<Record<string, any> | null>(null);

  const mockFailedWebhooks: FailedWebhook[] = [
    {
      id: 'wh_9021',
      source: 'mpesa_c2b',
      endpoint: '/api/v1/mpesa/c2b/callback',
      payload: {
        TransactionType: 'Pay Bill',
        TransID: 'RKT92104KS',
        TransAmount: '45000',
        BusinessShortCode: '600100',
        BillRefNumber: 'HOUSE-B4',
        MSISDN: '254712345678',
      },
      error_message: 'Unassigned Account: Unit reference HOUSE-B4 not matched to active lease.',
      retry_count: 2,
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ];

  const handleReplay = async (id: string) => {
    setReplayingId(id);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setReplayingId(null);
    alert(`Webhook [${id}] replayed and routed successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-1">
          <AlertOctagon size={16} /> Webhook Dead Letter Queue (DLQ)
        </div>
        <h1 className="text-xl font-extrabold">Payment & Gateway Callback Debugger</h1>
        <p className="text-slate-400 text-xs mt-1">
          Inspect raw payment payloads from Safaricom M-Pesa, SMS, or WhatsApp that failed database routing, and force re-evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm">Dropped Callbacks ({mockFailedWebhooks.length})</h3>

          <div className="divide-y divide-gray-100">
            {mockFailedWebhooks.map((wh) => (
              <div key={wh.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-[10px] font-bold uppercase">
                      {wh.source}
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-800">{wh.endpoint}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {new Date(wh.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {wh.error_message}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedPayload(wh.payload)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Code2 size={14} /> View Raw Payload
                  </button>

                  <button
                    onClick={() => handleReplay(wh.id)}
                    disabled={replayingId === wh.id}
                    className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <RotateCw size={13} className={replayingId === wh.id ? 'animate-spin' : ''} />
                    {replayingId === wh.id ? 'Replaying...' : 'Replay Callback'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span>JSON Inspector</span>
            <Code2 size={16} />
          </div>
          {selectedPayload ? (
            <pre className="overflow-x-auto text-emerald-400 bg-slate-900 p-3.5 rounded-xl text-[11px]">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          ) : (
            <p className="text-slate-500 py-12 text-center text-xs">Select "View Raw Payload" to inspect payload body.</p>
          )}
        </div>
      </div>
    </div>
  );
};