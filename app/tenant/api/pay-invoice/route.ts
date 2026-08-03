import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { invoice_id, amount } = await request.json();

    if (!invoice_id || !amount) {
      return NextResponse.json({ error: 'Missing invoice details' }, { status: 400 });
    }

    // Trigger payment gateway (M-Pesa, Card, etc.)
    return NextResponse.json({
      message: 'Payment request initiated successfully.',
      status: 'success',
      transaction_id: `TXN-${Date.now()}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}