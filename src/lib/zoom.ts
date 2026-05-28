export async function joinZoom(meetingUrlOrId: string) {
  // If passed a full URL, open directly if SDK not configured
  try {
    const meetingMatch = meetingUrlOrId.match(/(?:zoom.us\/(j)\/)?([0-9]{9,})(?:\?|$)/);
    const meetingNumber = meetingMatch ? meetingMatch[2] : meetingUrlOrId;

    // Try to get signature from server
    const resp = await fetch(`/api/zoom/signature?meetingNumber=${encodeURIComponent(meetingNumber)}&role=1`);
    if (!resp.ok) {
      // fallback: open meeting URL in new tab
      window.open(meetingUrlOrId, '_blank');
      return;
    }

    const body = await resp.json();
    const { signature, sdkKey, meetingNumber: mn, userName } = body;
    if (!signature || !sdkKey) {
      window.open(meetingUrlOrId, '_blank');
      return;
    }

    // Load Zoom SDK script if not present (lightweight loader)
    if (!(window as any).ZoomMtg) {
      await loadScript('https://source.zoom.us/2.13.0/zoom-meeting-2.13.0.min.js');
    }

    const ZoomMtg = (window as any).ZoomMtg;
    ZoomMtg.setZoomJSLib('https://source.zoom.us/2.13.0/lib', '/av');
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareJssdk();

    ZoomMtg.init({
      leaveUrl: window.location.origin,
      isSupportAV: true,
      success() {
        ZoomMtg.join({
          signature,
          meetingNumber: mn || meetingNumber,
          userName: userName || 'Admin',
          sdkKey,
          passWord: '',
          success: () => console.log('Joined meeting'),
          error: (e: any) => {
            console.error('Zoom join error', e);
            window.open(meetingUrlOrId, '_blank');
          },
        });
      },
      error(e: any) {
        console.error('Zoom init error', e);
        window.open(meetingUrlOrId, '_blank');
      },
    });
  } catch (error) {
    console.error('joinZoom failed', error);
    window.open(meetingUrlOrId, '_blank');
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}
