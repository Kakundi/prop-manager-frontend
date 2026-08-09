import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import AcceptInviteForm from './AcceptInviteForm';

export default async function AcceptInvitePage(props: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handled in server component lifecycle
          }
        },
      },
    }
  );

  if (searchParams.code) {
    await supabase.auth.exchangeCodeForSession(searchParams.code);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">PropManager HQ</h1>
          <p className="text-sm text-red-600 mb-4">
            {searchParams.error || 'Invalid or expired invitation link. Please request a new invite.'}
          </p>
          <a
            href="/login"
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return <AcceptInviteForm />;
}