// app/property-manager/api/subscriptions/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Replace this section with your actual DB client (e.g., supabase / prisma / pg Pool)
    // For example with Supabase:
    // const { data: invoices } = await supabase.from('subscription_invoices').select('*');
    // const { data: payments } = await supabase.from('subscription_payments').select('*');

    return NextResponse.json({
      invoices: [
        {
          id: 'inv_101',
          description: 'August 2026 Manager Platform License',
          due_date: '2026-08-15',
          amount: 150.00,
          status: 'unpaid',
        },
      ],
      payments: [
        {
          id: 'pmt_100',
          invoice_id: 'inv_100',
          description: 'July 2026 Manager Platform License',
          amount_paid: 150.00,
          payment_method: 'M-Pesa / Card',
          transaction_reference: 'MPESA-REG-882026',
          paid_at: '2026-07-10',
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}