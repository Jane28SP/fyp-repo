import React, { useEffect, useMemo, useState } from 'react';
import UserBookings from '../Bookings/UserBookings';
import { Event } from '../../lib/supabase';

interface AccountDashboardProps {
  userId: string;
}

type TabKey = 'bookings' | 'reviews' | 'profile';

const AccountDashboard: React.FC<AccountDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                activeTab === 'profile' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                activeTab === 'reviews' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              My Reviews
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                activeTab === 'bookings' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              My Bookings
            </button>
          </div>
        </aside>

        <main className="md:col-span-3">
          {activeTab === 'bookings' && <UserBookings userId={userId} />}
          {activeTab === 'reviews' && <MyReviews userId={userId} />}
          {activeTab === 'profile' && <ProfileForm userId={userId} />}
        </main>
      </div>
    </div>
  );
};

export default AccountDashboard;

// ========== My Reviews ==========

interface ReviewItem {
  eventId: string;
  rating: number;
  comment: string;
  date: string;
}

const MyReviews: React.FC<{ userId: string }> = ({ userId }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(`userReviews_${userId}`) || '[]');
    setReviews(data);
  }, [userId]);

  const eventMap = useMemo(() => {
    const list: Event[] = JSON.parse(localStorage.getItem('mockEvents') || '[]');
    const map = new Map<string, Event>();
    list.forEach(e => map.set(e.id, e));
    return map;
  }, []);

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600">Rate an event after you have attended it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r, idx) => {
        const ev = eventMap.get(r.eventId);
        return (
          <div key={idx} className="bg-white rounded-2xl border-2 border-gray-100 p-5 flex gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {ev?.image_url && <img src={ev.image_url} alt={ev?.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-gray-900">{ev?.title || 'Event'}</h4>
                <div className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString('en-MY')}</div>
              </div>
              <div className="mt-1 text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap">{r.comment}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ========== Profile ==========

const ProfileForm: React.FC<{ userId: string }> = ({ userId }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem(`userProfile_${userId}`) || 'null');
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatarUrl || '');
    }
  }, [userId]);

  const handleSave = () => {
    localStorage.setItem(
      `userProfile_${userId}`,
      JSON.stringify({ name, phone, avatarUrl })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Info</h3>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No Avatar</div>
          )}
        </div>
        <input
          type="url"
          placeholder="Avatar image URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="e.g. 012-345 6789"
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg"
          style={{ backgroundColor: '#FFBE54' }}
        >
          Save Changes
        </button>
        {saved && <span className="ml-3 text-green-600 font-semibold">Saved ✓</span>}
      </div>
    </div>
  );
};


