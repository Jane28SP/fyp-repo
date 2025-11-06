import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { fetchEvents } from 'api-client';
import type { Event } from 'shared';

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents(supabase);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#e53e3e' }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={loadEvents} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>No events yet</h3>
        <p>Create your first event in Supabase!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Events List</h2>
      <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#fff',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>{event.title}</h3>
            {event.description && (
              <p style={{ margin: '0 0 8px 0', color: '#718096' }}>{event.description}</p>
            )}
            <div style={{ fontSize: '14px', color: '#a0aec0' }}>
              <span>📅 {new Date(event.startsAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

