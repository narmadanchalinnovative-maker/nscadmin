import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RAW_TARGET = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://201.18.192.154:3001';
const TARGET_HOST = RAW_TARGET.replace(/\/api\/?$/, '').replace(/\/$/, '');

async function handleProxy(req: NextRequest) {
  const subpath = req.nextUrl.pathname.replace(/^\/external-api\/?/, '');
  const search = req.nextUrl.search;
  const targetUrl = `${TARGET_HOST}/api/${subpath}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!['host', 'connection', 'content-length', 'content-encoding'].includes(k)) {
      headers.set(key, value);
    }
  });

  const rawBody = req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined;
  const body = rawBody && rawBody.byteLength > 0 ? rawBody : undefined;

  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
        cache: 'no-store',
      });

      const responseBody = await response.arrayBuffer();
      const responseHeaders = new Headers();
      response.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k)) {
          responseHeaders.set(key, value);
        }
      });

      return new NextResponse(responseBody, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (err: any) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }

  return NextResponse.json(
    { success: false, error: 'Target connection failed', message: lastError?.message },
    { status: 502 }
  );
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
