import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('🔄 Auth callback called with URL:', request.url);
  
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error_description = requestUrl.searchParams.get('error_description');
    const error = requestUrl.searchParams.get('error');
    const origin = requestUrl.origin;
    
    console.log('📝 Callback parameters:', {
      code: code ? 'Present' : 'Missing',
      error,
      error_description
    });

    // Check for OAuth errors first
    if (error) {
      console.error('❌ OAuth error:', error, error_description);
      
      // Handle specific database error
      if (error_description?.includes('Database error saving new user')) {
        console.error('Database trigger error - user creation failed in profiles table');
        // Try to get more info about the user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('User exists in auth but profile creation failed:', user.email);
        }
      }
      
      return NextResponse.redirect(
        `${origin}/auth/signin?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`
      );
    }

    if (!code) {
      console.error('❌ No code provided in callback');
      return NextResponse.redirect(`${origin}/auth/signin?error=no_code`);
    }

    const supabase = await createClient();
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(sessionError.message)}`);
    }

    if (data.session) {
      console.log('✅ Session created successfully for:', data.session.user.email);
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (profileError) {
        console.warn('Profile not found, may need manual creation:', profileError);
      } else {
        console.log('✅ Profile exists:', profile?.email);
      }
      
      // Successful authentication, redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // No session created
    console.error('No session created after code exchange');
    return NextResponse.redirect(`${origin}/auth/signin?error=no_session`);

  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}/auth/signin?error=server_error`);
  }
}