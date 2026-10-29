import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    let key = process.env.NVIDIA_API_KEY?.trim() || '';

    // If not in process.env, try reading from .env.local directly
    if (!key) {
      const envPath = path.join(process.cwd(), '.env.local');
      try {
        const content = await fs.readFile(envPath, 'utf8');
        const match = content.match(/^NVIDIA_API_KEY=(.+)$/m);
        if (match && match[1]) {
          key = match[1].trim();
        }
      } catch {}
    }

    return NextResponse.json({
      hasKey: !!key,
      apiKey: key,
      maskedKey: key ? `${key.slice(0, 10)}...${key.slice(-4)}` : '',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'Valid apiKey is required.' }, { status: 400 });
    }

    const trimmedKey = apiKey.trim();
    const envPath = path.join(process.cwd(), '.env.local');

    let currentContent = '';
    try {
      currentContent = await fs.readFile(envPath, 'utf8');
    } catch {
      // .env.local doesn't exist yet, try to read from .env.example
      try {
        const examplePath = path.join(process.cwd(), '.env.example');
        currentContent = await fs.readFile(examplePath, 'utf8');
      } catch {
        currentContent = '';
      }
    }

    let newContent = '';
    if (/^NVIDIA_API_KEY=.*/m.test(currentContent)) {
      newContent = currentContent.replace(/^NVIDIA_API_KEY=.*/m, `NVIDIA_API_KEY=${trimmedKey}`);
    } else {
      newContent = currentContent.trim() + `\n\n# User configured key\nNVIDIA_API_KEY=${trimmedKey}\n`;
    }

    await fs.writeFile(envPath, newContent, 'utf8');

    // Also update runtime process.env
    process.env.NVIDIA_API_KEY = trimmedKey;

    return NextResponse.json({
      success: true,
      message: 'NVIDIA API Key saved successfully to .env.local and runtime environment.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to save API key: ${msg}` }, { status: 500 });
  }
}
