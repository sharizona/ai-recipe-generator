import type { Schema } from '../../data/resource';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

type MeetingResult = {
  id?: number;
  join_url?: string;
  start_time?: string;
};

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

async function createZoomMeeting(params: {
  topic: string;
  date: string;
  time: string;
  timezone?: string | null;
}) {
  const time24 = to24Hour(params.time);
  if (!time24) {
    throw new Error('Invalid time format');
  }
  const timezone = params.timezone || DEFAULT_TIMEZONE;
  const startTime = `${params.date}T${time24}:00`;
  const accessToken = await getZoomAccessToken();

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2,
      start_time: startTime,
      duration: 30,
      timezone,
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zoom meeting error: ${text}`);
  }

  const data = (await response.json()) as MeetingResult;
  return {
    meetingId: data.id ? data.id.toString() : '',
    joinUrl: data.join_url || '',
    startTime: data.start_time || startTime,
  };
}

async function sendConfirmationEmail(params: {
  to: string;
  from: string;
  meetingUrl: string;
  displayTime: string;
  timezone?: string | null;
}) {
  const regionEnv = process.env.SES_REGION || '';
  const region = regionEnv.includes('resolved during runtime') || !regionEnv ? 'us-west-2' : regionEnv;
  const client = new SESv2Client({ region });
  const timezone = params.timezone || DEFAULT_TIMEZONE;
  const subject = 'Your Zoom session is confirmed';
  const bodyText = [
    'Your Zoom session is confirmed.',
    '',
    `Time: ${params.displayTime} (${timezone})`,
    `Join link: ${params.meetingUrl}`,
    '',
    'See you soon!',
  ].join('\n');

  const command = new SendEmailCommand({
    FromEmailAddress: params.from,
    Destination: {
      ToAddresses: [params.to],
    },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: bodyText },
        },
      },
    },
  });

  await client.send(command);
}

export const handler: Schema['createZoomMeeting']['functionHandler'] = async (event) => {
  const { name, email, date, time, topic, timezone } = event.arguments;
  if (!name || !email || !date || !time || !topic) {
    throw new Error('Missing required booking details');
  }

  try {
    const meeting = await createZoomMeeting({ topic, date, time, timezone });
    if (!meeting.joinUrl || !meeting.meetingId) {
      throw new Error('Zoom meeting creation returned incomplete data');
    }

    const fromEmail = process.env.FROM_EMAIL || '';
    if (!fromEmail) {
      throw new Error('Missing SES from email');
    }

    const displayTime = `${date} at ${time}`;
    await sendConfirmationEmail({
      to: email,
      from: fromEmail,
      meetingUrl: meeting.joinUrl,
      displayTime,
      timezone,
    });

    return {
      meetingUrl: meeting.joinUrl,
      meetingId: meeting.meetingId,
      startTime: meeting.startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Zoom booking failed:', error);
    throw new Error(`Zoom booking failed: ${message}`);
  }
};
