import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { unit_id, unit_number, tenant_name, previous_reading, current_reading, rate_per_unit } = body;

    if (current_reading < previous_reading) {
      return NextResponse.json(
        { error: 'Current meter reading cannot be lower than previous reading.' },
        { status: 400 }
      );
    }

    const units_consumed = current_reading - previous_reading;
    const total_amount = units_consumed * rate_per_unit;

    const invoicePayload = {
      id: `INV-WAT-${Date.now()}`,
      unit_id,
      unit_number,
      tenant_name,
      previous_reading,
      current_reading,
      units_consumed,
      rate_per_unit,
      total_amount,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    // Trigger external notification/SMS/email dispatch to tenant here

    return NextResponse.json({
      message: 'Water invoice generated and sent to tenant successfully.',
      invoice: invoicePayload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}