import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // 1. Get current logged-in user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query the profiles table for full_name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role, email')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error querying profiles table:', profileError);
    }

    // 3. Fallback hierarchy for user full name
    const fullName = 
      profile?.full_name || 
      user.user_metadata?.full_name || 
      user.user_metadata?.name || 
      user.email?.split('@')[0] || 
      'Property Manager';

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: profile?.role || 'property_manager',
    });
  } catch (err) {
    console.error('API /api/auth/me internal error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}