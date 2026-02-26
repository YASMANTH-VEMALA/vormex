import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, codeVerifier, redirectUri } = body;

    if (!code || !codeVerifier) {
      return NextResponse.json(
        { error: 'Code and code verifier are required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not set');
      return NextResponse.json(
        { error: 'Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.' },
        { status: 500 }
      );
    }

    if (!GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        {
          error: 'Google Client Secret is required. Set GOOGLE_CLIENT_SECRET in vormex-web/.env.local. Get it from Google Cloud Console > APIs & Services > Credentials.',
        },
        { status: 500 }
      );
    }

    // redirect_uri must EXACTLY match what was used when redirecting to Google + what's in Google Cloud Console
    const effectiveRedirectUri = redirectUri || `http://localhost:3000/auth/google/callback`;

    const tokenParams = new URLSearchParams({
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: effectiveRedirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    // Exchange authorization code for tokens using PKCE
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      const errorCode = errorData.error;
      const errorDesc = errorData.error_description || errorData.error || 'Failed to exchange authorization code';

      console.error('Google token exchange error:', {
        status: tokenResponse.status,
        error: errorData,
        redirectUriUsed: effectiveRedirectUri,
      });

      // Helpful messages for common Google OAuth errors
      let userMessage = errorDesc;
      if (errorCode === 'invalid_client') {
        userMessage = 'Invalid Google credentials. Check that GOOGLE_CLIENT_SECRET in .env.local matches the Web application client in Google Cloud Console.';
      } else if (errorCode === 'redirect_uri_mismatch') {
        userMessage = `Redirect URI mismatch. Add exactly this to Google Cloud Console > Credentials > Authorized redirect URIs: http://localhost:3000/auth/google/callback`;
      } else if (errorCode === 'invalid_grant') {
        userMessage = 'Authorization code expired or already used. Please try signing in again.';
      }

      return NextResponse.json(
        { error: userMessage },
        { status: 401 }
      );
    }

    const tokens = await tokenResponse.json();

    if (!tokens.id_token) {
      return NextResponse.json(
        { error: 'ID token not found in token response' },
        { status: 500 }
      );
    }

    // Return the id_token to the frontend
    return NextResponse.json({
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
    });
  } catch (error: any) {
    console.error('Google OAuth token exchange error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

