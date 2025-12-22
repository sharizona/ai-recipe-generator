import type { Schema } from '../../data/resource';

const DEFAULT_TIMEZONE = 'UTC';

function to24Hour(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }
  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) {
    hours += 12;
  }
  if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

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

export const handler: Schema['updateZoomMeeting']['functionHandler'] = async (event) => {
  const { meetingId, date, time, timezone, topic } = event.arguments;
  if (!meetingId || !date || !time) {
    throw new Error('Missing required update details');
  }
  const time24 = to24Hour(time);
  if (!time24) {
    throw new Error('Invalid time format');
  }

  const accessToken = await getZoomAccessToken();
  const startTime = `${date}T${time24}:00`;
  const resolvedTimezone = timezone || DEFAULT_TIMEZONE;

  const response = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      start_time: startTime,
      timezone: resolvedTimezone,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zoom update error: ${text}`);
  }

  return { startTime };
};
