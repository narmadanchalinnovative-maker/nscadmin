import { NextResponse } from 'next/server';

// This is a template endpoint. For production you MUST implement secure
// signature generation on the server using your Zoom SDK Key and Secret.
// Do NOT expose your Zoom SDK Secret to the browser.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const meetingNumber = url.searchParams.get('meetingNumber');
  const role = url.searchParams.get('role') || '1';

  // If environment variables are not set, return a helpful message.
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;

  if (!sdkKey || !sdkSecret) {
    return NextResponse.json(
      {
        error: 'Zoom SDK keys not configured on server. Set ZOOM_SDK_KEY and ZOOM_SDK_SECRET in environment.',
        note: 'Please implement signature generation using Zoom docs. This endpoint currently acts as a template.'
      },
      { status: 501 }
    );
  }

  // NOTE: Implement signature generation per Zoom docs here.
  // Example (pseudocode):
  // const timestamp = new Date().getTime() - 30000;
  // const msg = Buffer.from(`${sdkKey}${meetingNumber}${timestamp}${role}`).toString('base64');
  // const hash = crypto.createHmac('sha256', sdkSecret).update(msg).digest('base64');
  // const signature = Buffer.from(`${sdkKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

  return NextResponse.json({
    error: 'Not implemented',
    message: 'Signature generation is not implemented in this template. Add server-side signing code per Zoom Web SDK documentation.'
  }, { status: 501 });
}
