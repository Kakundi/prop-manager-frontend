// app/developer/api/system-health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const mockServices = [
    { id: '1', name: 'Supabase Database Cluster', status: 'operational', latency_ms: 24, last_checked: new Date().toISOString() },
    { id: '2', name: 'M-Pesa Daraja STK Push Gateway', status: 'operational', latency_ms: 110, last_checked: new Date().toISOString() },
    { id: '3', name: 'WhatsApp Business API Bot', status: 'operational', latency_ms: 85, last_checked: new Date().toISOString() },
    { id: '4', name: 'SendGrid Email Dispatcher', status: 'operational', latency_ms: 42, last_checked: new Date().toISOString() },
  ];

  const mockMetrics = {
    active_sessions: 42,
    db_pool_usage_percent: 18,
    api_requests_24h: 12480,
    error_rate_percent: 0.02,
  };

  return NextResponse.json({ services: mockServices, metrics: mockMetrics }, { status: 200 });
}