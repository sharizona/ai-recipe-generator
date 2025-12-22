import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Calendar, Clock, Video, User, Mail, MessageSquare } from 'lucide-react';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function ZoomBooking() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        date: '',
        time: '',
        topic: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBooked, setIsBooked] = useState(false);
    const [meetingInfo, setMeetingInfo] = useState<{ url: string; startTime: string } | null>(null);
    const [meetingId, setMeetingId] = useState<string | null>(null);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [bookingStatus, setBookingStatus] = useState<'confirmed' | 'canceled' | 'rescheduled'>('confirmed');
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');

    const availableTimes = [
        '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    const topics = [
        'Recipe Consultation',
        'Cooking Tips & Techniques',
        'Meal Planning Session',
        'Dietary Guidance',
        'Other'
    ];

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.date || !formData.time || !formData.topic) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const { data, errors } = await client.queries.createZoomMeeting({
                name: formData.name,
                email: formData.email,
                date: formData.date,
                time: formData.time,
                topic: formData.topic,
                notes: formData.notes || undefined,
                timezone
            });

            if (errors) {
                console.error('Zoom booking errors:', errors);
                alert('Failed to book the session. Please try again.');
                return;
            }

            if (!data?.meetingUrl || !data.startTime || !data.meetingId) {
                alert('Booking completed, but meeting details are missing.');
                return;
            }

            setMeetingInfo({ url: data.meetingUrl, startTime: data.startTime });
            setMeetingId(data.meetingId);
            setBookingStatus('confirmed');

            const user = await getCurrentUser();
            const bookingResult = await client.models.Booking.create({
                userId: user.userId,
                name: formData.name,
                email: formData.email,
                topic: formData.topic,
                notes: formData.notes || '',
                date: formData.date,
                time: formData.time,
                timezone,
                meetingId: data.meetingId,
                meetingUrl: data.meetingUrl,
                startTime: data.startTime,
                status: 'confirmed'
            });
            if (bookingResult.data?.id) {
                setBookingId(bookingResult.data.id);
            }
            setIsBooked(true);
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Failed to book the session. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!meetingId) {
            return;
        }
        setIsSubmitting(true);
        try {
            const { data, errors } = await client.queries.cancelZoomMeeting({ meetingId });
            if (errors || !data?.cancelled) {
                alert('Failed to cancel the meeting. Please try again.');
                return;
            }
            setBookingStatus('canceled');
            if (bookingId) {
                await client.models.Booking.update({
                    id: bookingId,
                    status: 'canceled'
                });
            }
        } catch (error) {
            console.error('Cancel failed:', error);
            alert('Failed to cancel the meeting. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReschedule = async () => {
        if (!meetingId || !rescheduleDate || !rescheduleTime) {
            alert('Please select a new date and time.');
            return;
        }
        setIsSubmitting(true);
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const { data, errors } = await client.queries.updateZoomMeeting({
                meetingId,
                date: rescheduleDate,
                time: rescheduleTime,
                timezone
            });

            if (errors || !data?.startTime) {
                alert('Failed to reschedule the meeting. Please try again.');
                return;
            }

            const newStartTime = data.startTime as string;
            setMeetingInfo((prev) => prev ? { ...prev, startTime: newStartTime } : prev);
            setBookingStatus('rescheduled');
            setFormData((prev) => ({ ...prev, date: rescheduleDate, time: rescheduleTime }));

            if (bookingId) {
                await client.models.Booking.update({
                    id: bookingId,
                    date: rescheduleDate,
                    time: rescheduleTime,
                    startTime: newStartTime,
                    status: 'rescheduled'
                });
            }
        } catch (error) {
            console.error('Reschedule failed:', error);
            alert('Failed to reschedule the meeting. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            date: '',
            time: '',
            topic: '',
            notes: ''
        });
        setIsBooked(false);
        setMeetingInfo(null);
        setMeetingId(null);
        setBookingId(null);
        setBookingStatus('confirmed');
        setRescheduleDate('');
        setRescheduleTime('');
    };

    if (isBooked) {
        return (
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
                <div style={{
                    background: '#f0fdf4',
                    border: '2px solid #22c55e',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#22c55e',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <Video style={{ width: '32px', height: '32px', color: 'white' }} />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534', marginBottom: '10px' }}>
                        Session Booked!
                    </h2>
                    <p style={{ color: '#15803d', marginBottom: '12px', fontSize: '16px' }}>
                        Your Zoom session is scheduled for {formData.date} at {formData.time}
                    </p>
                    <p style={{ color: '#166534', marginBottom: '24px', fontSize: '14px' }}>
                        Status: {bookingStatus}
                    </p>
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'left'
                    }}>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                            Confirmation sent to:
                        </p>
                        <p style={{ fontWeight: '600', color: '#111827' }}>
                            {formData.email}
                        </p>
                    </div>
                    {meetingInfo?.url && (
                        <p style={{ fontSize: '14px', color: '#111827', marginBottom: '16px' }}>
                            Join link: <a href={meetingInfo.url} target="_blank" rel="noreferrer">{meetingInfo.url}</a>
                        </p>
                    )}
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                        A Zoom meeting link has been emailed to you.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
                        <button
                            onClick={handleCancel}
                            disabled={isSubmitting || bookingStatus === 'canceled'}
                            style={{
                                background: bookingStatus === 'canceled' ? '#9ca3af' : '#dc2626',
                                color: 'white',
                                padding: '10px 18px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            {bookingStatus === 'canceled' ? 'Canceled' : 'Cancel Session'}
                        </button>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>
                            Reschedule
                        </p>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <input
                                type="date"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '14px'
                                }}
                            />
                            <select
                                value={rescheduleTime}
                                onChange={(e) => setRescheduleTime(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select time</option>
                                {availableTimes.map((slot) => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleReschedule}
                                disabled={isSubmitting || bookingStatus === 'canceled'}
                                style={{
                                    background: '#2563eb',
                                    color: 'white',
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                Reschedule
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={resetForm}
                        style={{
                            background: '#16a34a',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        Book Another Session
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px' }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
                    padding: '32px',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Video style={{ width: '32px', height: '32px' }} />
                        <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                            Book a Live Zoom Session
                        </h2>
                    </div>
                    <p style={{ color: '#bfdbfe', margin: 0 }}>
                        Schedule a one-on-one consultation with our culinary experts
                    </p>
                </div>

                <div style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            <User style={{ width: '16px', height: '16px' }} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                            placeholder="John Doe"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            <Mail style={{ width: '16px', height: '16px' }} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                <Calendar style={{ width: '16px', height: '16px' }} />
                                Preferred Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                <Clock style={{ width: '16px', height: '16px' }} />
                                Preferred Time
                            </label>
                            <select
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box',
                                    background: 'white'
                                }}
                            >
                                <option value="">Select a time</option>
                                {availableTimes.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            <MessageSquare style={{ width: '16px', height: '16px' }} />
                            Session Topic
                        </label>
                        <select
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                                background: 'white'
                            }}
                        >
                            <option value="">Select a topic</option>
                            {topics.map(topic => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                                resize: 'vertical'
                            }}
                            placeholder="Any specific topics or questions you'd like to discuss..."
                        />
                    </div>

                    <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px'
                    }}>
                        <p style={{ fontSize: '14px', color: '#1e40af', margin: 0, lineHeight: '1.6' }}>
                            <strong>Session Duration:</strong> 30 minutes<br />
                            <strong>Cost:</strong> 5 credits<br />
                            You'll receive a Zoom link via email 24 hours before your session.
                        </p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
                            color: 'white',
                            fontWeight: '600',
                            padding: '16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '16px'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid white',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                Booking...
                            </>
                        ) : (
                            <>
                                <Video style={{ width: '20px', height: '20px' }} />
                                Book Session (5 Credits)
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
