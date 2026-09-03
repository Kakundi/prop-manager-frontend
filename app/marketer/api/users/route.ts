// app/marketer/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin / Service Client to allow creating records & accessing schema
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET: Fetch all assigned building users (tenants, caretakers, maintenance staff)
 * joins client, property, and unit details for display in the table.
 */
export async function GET(req: NextRequest) {
  try {
    // Auth Token Verification (Optional header pass-through)
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      await supabase.auth.getUser(token);
    }

    // Query assigned_users table with relations
    const { data: users, error } = await supabase
      .from('assigned_users')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        client_id,
        property_id,
        unit_id,
        created_at,
        clients:client_id (
          full_name
        ),
        properties:property_id (
          name
        ),
        units:unit_id (
          unit_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch assigned users.' },
        { status: 500 }
      );
    }

    // Flatten joined database relations into the expected AssignedUser interface shape
    const formattedUsers = (users || []).map((u: any) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      client_id: u.client_id,
      client_name: u.clients?.full_name || null,
      property_id: u.property_id,
      property_name: u.properties?.name || null,
      unit_id: u.unit_id || null,
      unit_number: u.units?.unit_number || null,
      created_at: u.created_at,
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: Register and assign a new user (Tenant, Caretaker, Staff)
 * to a client property and optional unit.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, role, clientId, propertyId, unitId } = body;

    // Server-side Validation
    if (!fullName || !email || !role || !clientId || !propertyId) {
      return NextResponse.json(
        { error: 'Full name, email, role, client, and property are required.' },
        { status: 400 }
      );
    }

    // 1. Insert user into assigned_users
    const { data: newUser, error: insertError } = await supabase
      .from('assigned_users')
      .insert([
        {
          full_name: fullName,
          email: email,
          phone: phone || null,
          role: role,
          client_id: clientId,
          property_id: propertyId,
          unit_id: role === 'tenant' && unitId ? unitId : null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting assigned user:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Failed to assign user.' },
        { status: 500 }
      );
    }

    // 2. If assigning a tenant with a selected unit, mark that unit as occupied
    if (role === 'tenant' && unitId) {
      const { error: unitUpdateError } = await supabase
        .from('units')
        .update({ is_occupied: true })
        .eq('id', unitId);

      if (unitUpdateError) {
        console.warn('User assigned but unit occupancy status update failed:', unitUpdateError.message);
      }
    }

    return NextResponse.json(
      { message: 'User assigned successfully.', user: newUser },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}