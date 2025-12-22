import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type Booking = Schema['Booking']['type'];

type RescheduleState = Record<string, { date: string; time: string }>;

const availableTimes = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

function sortByStartTime(items: Booking[]) {
  return [...items].sort((a, b) => {
    const aTime = a.startTime ? Date.parse(a.startTime) : 0;
    const bTime = b.startTime ? Date.parse(b.startTime) : 0;
    return bTime - aTime;
  });
}

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rescheduleState, setRescheduleState] = useState<RescheduleState>({});

  const loadBookings = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const { data } = await client.models.Booking.list({
        filter: { userId: { eq: user.userId } }
      });
      setBookings(sortByStartTime(data || []));
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const updateRescheduleState = (id: string, changes: Partial<{ date: string; time: string }>) => {
    setRescheduleState((prev) => ({
      ...prev,
      [id]: {
        date: prev[id]?.date || '',
        time: prev[id]?.time || '',
        ...changes
      }
    }));
  };

  const handleCancel = async (booking: Booking) => {
    if (!booking.meetingId) {
      return;
    }
    setBusyId(booking.id);
    try {
      const { data, errors } = await client.queries.cancelZoomMeeting({ meetingId: booking.meetingId });
      if (errors || !data?.cancelled) {
        alert('Failed to cancel the meeting. Please try again.');
        return;
      }
      await client.models.Booking.update({
        id: booking.id,
        status: 'canceled'
      });
      setBookings((prev) =>
        prev.map((item) => item.id === booking.id ? { ...item, status: 'canceled' } : item)
      );
    } catch (error) {
      console.error('Cancel failed:', error);
      alert('Failed to cancel the meeting. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReschedule = async (booking: Booking) => {
    if (!booking.meetingId) {
      return;
    }
    const reschedule = rescheduleState[booking.id];
    if (!reschedule?.date || !reschedule?.time) {
      alert('Please select a new date and time.');
      return;
    }
    setBusyId(booking.id);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data, errors } = await client.queries.updateZoomMeeting({
        meetingId: booking.meetingId,
        date: reschedule.date,
        time: reschedule.time,
        timezone
      });
      if (errors || !data?.startTime) {
        alert('Failed to reschedule. Please try again.');
        return;
      }
      await client.models.Booking.update({
        id: booking.id,
        date: reschedule.date,
        time: reschedule.time,
        startTime: data.startTime,
        status: 'rescheduled'
      });
      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                date: reschedule.date,
                time: reschedule.time,
                startTime: data.startTime,
                status: 'rescheduled'
              }
            : item
        )
      );
    } catch (error) {
      console.error('Reschedule failed:', error);
      alert('Failed to reschedule. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, fontSize: '28px' }}>My Bookings</h2>
        <p style={{ margin: '6px 0 0', color: '#e0f2fe' }}>
          Manage your upcoming and past sessions.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>You have no bookings yet.</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} style={{
            background: 'white',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{booking.topic}</h3>
                <p style={{ margin: '6px 0 0', color: '#475569' }}>
                  {booking.date} at {booking.time} ({booking.timezone || 'UTC'})
                </p>
                <p style={{ margin: '6px 0 0', color: '#475569' }}>Status: {booking.status}</p>
                {booking.meetingUrl && (
                  <p style={{ margin: '6px 0 0' }}>
                    <a href={booking.meetingUrl} target="_blank" rel="noreferrer">
                      Join Zoom meeting
                    </a>
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => handleCancel(booking)}
                  disabled={busyId === booking.id || booking.status === 'canceled'}
                  style={{
                    background: booking.status === 'canceled' ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {booking.status === 'canceled' ? 'Canceled' : 'Cancel'}
                </button>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '14px'
            }}>
              <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#0f172a' }}>Reschedule</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  value={rescheduleState[booking.id]?.date || ''}
                  onChange={(e) => updateRescheduleState(booking.id, { date: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5f5'
                  }}
                />
                <select
                  value={rescheduleState[booking.id]?.time || ''}
                  onChange={(e) => updateRescheduleState(booking.id, { time: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5f5'
                  }}
                >
                  <option value="">Select time</option>
                  {availableTimes.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleReschedule(booking)}
                  disabled={busyId === booking.id || booking.status === 'canceled'}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
