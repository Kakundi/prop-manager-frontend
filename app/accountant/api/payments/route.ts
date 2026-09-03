// app/accountant/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const { data: rentRoll, error } = await supabase
      .from('assigned_users')
      .select(`
        id,
        full_name,
        role,
        units (
          id,
          unit_number,
          rent_amount,
          water_fee,
          garbage_fee,
          properties ( name )
        )
      `)
      .eq('role', 'tenant');

    if (error) throw error;

    const formattedRentRoll = (rentRoll || []).map((user: any) => {
      const unit = user.units || {};
      const property = unit.properties || {};
      const rent = unit.rent_amount || 0;
      const water = unit.water_fee || 0;
      const garbage = unit.garbage_fee || 0;
      const total = rent + water + garbage;

      return {
        id: user.id,
        tenant_name: user.full_name,
        property_name: property.name || 'Unassigned Property',
        unit_number: unit.unit_number || 'N/A',
        monthly_rent: rent,
        water_fee: water,
        garbage_fee: garbage,
        total_due: total,
        amount_paid: 0,
        balance: total,
        status: 'pending',
        due_date: new Date().toISOString(),
      };
    });

    return NextResponse.json({ rentRoll: formattedRentRoll }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}