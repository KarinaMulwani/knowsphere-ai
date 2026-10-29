import { NextRequest, NextResponse } from 'next/server';
import { NVIDIA_BASE_URL } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body?.apiKey?.trim() || req.headers.get('x-nvidia-api-key')?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'Please enter an NVIDIA API Key.' },
        { status: 400 }
      );
    }

    // Ping NVIDIA NIM models endpoint to test authentication
    const res = await fetch(`${NVIDIA_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({
        valid: true,
        message: 'NVIDIA API Key successfully verified and active!',
        modelCount: Array.isArray(data?.data) ? data.data.length : undefined,
      });
    }

    const errData = await res.json().catch(() => ({}));
    const errorMsg =
      errData?.error?.message ||
      errData?.detail ||
      (res.status === 401
        ? 'Invalid API key or unauthorized. Please verify your key at build.nvidia.com.'
        : `NVIDIA returned status ${res.status}`);

    return NextResponse.json({ valid: false, error: errorMsg }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ valid: false, error: `Connection failed: ${msg}` }, { status: 500 });
  }
}
