import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : supabase;

    let targetUserId = user?.id;

    if (!targetUserId) {
      const { data: fallbackProfile } = await dbClient
        .from('profiles')
        .select('id')
        .eq('role', 'caretaker')
        .limit(1)
        .maybeSingle();

      targetUserId = fallbackProfile?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'No caretaker profile found' }, { status: 404 });
    }

    // Fetch Profile
    const { data: profile } = await dbClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', targetUserId)
      .maybeSingle();

    // Fetch Assigned Property from Caretaker / Properties mapping
    const { data: propertyAssignment } = await dbClient
      .from('properties')
      .select('id, name')
      .eq('caretaker_id', targetUserId)
      .maybeSingle();

    return NextResponse.json({
      profile: {
        full_name: profile?.full_name || 'Caretaker',
        assigned_property_id: propertyAssignment?.id || null,
        assigned_property_name: propertyAssignment?.name || 'No assigned property'
      }
    });
  } catch (err) {
    console.error('Fatal API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}