import type { Schema } from '../../data/resource';

async function getZoomAccessToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID || '';
  const clientId = process.env.ZOOM_CLIENT_ID || '';
  const clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom credentials');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zoom token error: ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export const handler: Schema['cancelZoomMeeting']['functionHandler'] = async (event) => {
  const { meetingId } = event.arguments;
  if (!meetingId) {
    throw new Error('Missing meeting ID');
  }

  const accessToken = await getZoomAccessToken();
  const response = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zoom cancel error: ${text}`);
  }

  return { cancelled: true };
};
