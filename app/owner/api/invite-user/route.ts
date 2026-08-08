import { NextResponse } from 'next/server';

// GET: Fetch list of managed users for the directory
export async function GET() {
  try {
    // TODO: Query your database (e.g., Supabase / Prisma) for managed users
    const users: any[] = []; // Replace with actual database fetch logic

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST: Process user invitation and trigger email verification
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, phone, role, property_id, unit_number } = body;

    if (!full_name || !email || !role || !property_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: 1. Save user record to database
    // TODO: 2. Trigger automated email verification (e.g., Resend / SendGrid / Supabase Auth)

    return NextResponse.json(
      { message: 'User invited successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}