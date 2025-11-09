import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserBookings from '../Bookings/UserBookings';
import UserWishlist from '../Wishlist/UserWishlist';
import { Event, supabase } from '../../lib/supabase';

interface AccountDashboardProps {
  userId: string;
  userEmail?: string;
}

type TabKey = 'bookings' | 'reviews' | 'profile' | 'wishlist';

const AccountDashboard: React.FC<AccountDashboardProps> = ({ userId, userEmail: propUserEmail }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('bookings');

  // Check URL hash or search params to determine initial tab
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab') || hash || 'bookings';
    
    if (tab === 'bookings' || tab === 'reviews' || tab === 'profile' || tab === 'wishlist') {
      setActiveTab(tab as TabKey);
    }
  }, [location]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 space-y-2">
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                activeTab === 'profile' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              Personal Info
            </button>
            <button
              onClick={() => handleTabChange('reviews')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                activeTab === 'reviews' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              My Reviews
            </button>
            <button
              onClick={() => handleTabChange('wishlist')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                activeTab === 'wishlist' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              My Wishlist
            </button>
            <button
              onClick={() => handleTabChange('bookings')}
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
          {activeTab === 'wishlist' && <UserWishlist userId={userId} />}
          {activeTab === 'profile' && <ProfileForm userId={userId} userEmail={propUserEmail} />}
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
    const map = new Map<string, Event>();
    // Events will be loaded from Supabase when needed
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

const ProfileForm: React.FC<{ userId: string; userEmail?: string }> = ({ userId, userEmail: propUserEmail }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [title, setTitle] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [countryRegion, setCountryRegion] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(propUserEmail || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Use prop email if available
    if (propUserEmail) {
      setUserEmail(propUserEmail);
    }

    // Load from database first, then fallback to localStorage
    const loadProfile = async () => {
      try {
        // Try to load from database
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          setName(data.full_name || '');
          setPhone(data.phone || '');
          setAvatarUrl(data.avatar_url || '');
          setTitle(data.title || '');
          setDateOfBirth(data.date_of_birth || '');
          setCountryRegion(data.country_region || '');
        } else {
          // Fallback to localStorage
          const profile = JSON.parse(localStorage.getItem(`userProfile_${userId}`) || 'null');
          if (profile) {
            setName(profile.name || '');
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatarUrl || '');
            setTitle(profile.title || '');
            setDateOfBirth(profile.dateOfBirth || '');
            setCountryRegion(profile.countryRegion || '');
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to localStorage
        const profile = JSON.parse(localStorage.getItem(`userProfile_${userId}`) || 'null');
        if (profile) {
          setName(profile.name || '');
          setPhone(profile.phone || '');
          setAvatarUrl(profile.avatarUrl || '');
          setTitle(profile.title || '');
          setDateOfBirth(profile.dateOfBirth || '');
          setCountryRegion(profile.countryRegion || '');
        }
      }
    };

    loadProfile();
  }, [userId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Try to upload to Supabase Storage with a short timeout (3 seconds)
      // If it fails or times out, use local object URL immediately
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Try upload with short timeout
      const uploadPromise = supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 3000)
      );

      let finalAvatarUrl = '';

      try {
        const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as any;
        
        if (uploadResult?.error) {
          throw uploadResult.error;
        }

        // Upload successful, get public URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        finalAvatarUrl = data.publicUrl;
      } catch (uploadError) {
        // Upload failed or timed out, use local object URL
        console.log('Using local preview (storage may not be configured):', uploadError);
        finalAvatarUrl = URL.createObjectURL(file);
      }

      // Save to database
      setAvatarUrl(finalAvatarUrl);
      
            // Upsert to database
            const { error: dbError } = await supabase
              .from('user_profiles')
              .upsert({
                user_id: userId,
                avatar_url: finalAvatarUrl,
                full_name: name,
                phone: phone,
                title: title,
                date_of_birth: dateOfBirth || null,
                country_region: countryRegion,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });

      if (dbError) {
        console.error('Error saving to database:', dbError);
        // Still save to localStorage as backup
        localStorage.setItem(
          `userProfile_${userId}`,
          JSON.stringify({ name, phone, avatarUrl: finalAvatarUrl })
        );
      }

      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: finalAvatarUrl } }));

    } catch (error: any) {
      console.error('Error uploading file:', error);
      // Use object URL as fallback
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      
            // Try to save to database
            try {
              await supabase
                .from('user_profiles')
                .upsert({
                  user_id: userId,
                  avatar_url: objectUrl,
                  full_name: name,
                  phone: phone,
                  title: title,
                  date_of_birth: dateOfBirth || null,
                  country_region: countryRegion,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                });
            } catch (dbError) {
              console.error('Error saving to database:', dbError);
            }
            
            localStorage.setItem(
              `userProfile_${userId}`,
              JSON.stringify({ name, phone, avatarUrl: objectUrl, title, dateOfBirth, countryRegion })
            );
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: objectUrl } }));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    try {
      // Save to database
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: name,
          phone: phone,
          avatar_url: avatarUrl,
          title: title,
          date_of_birth: dateOfBirth || null,
          country_region: countryRegion,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving profile:', error);
        // Fallback to localStorage
        localStorage.setItem(
          `userProfile_${userId}`,
          JSON.stringify({ name, phone, avatarUrl, title, dateOfBirth, countryRegion })
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // Fallback to localStorage
      localStorage.setItem(
        `userProfile_${userId}`,
        JSON.stringify({ name, phone, avatarUrl, title, dateOfBirth, countryRegion })
      );
    }

    // Trigger storage update event
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Info</h3>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200 shadow-sm group flex items-center justify-center">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="avatar" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar on error - use email prefix for consistency with header
                const emailPrefix = userEmail?.split('@')[0] || 'User';
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emailPrefix)}&background=E4281F&color=fff&size=80&bold=true`;
              }}
            />
          ) : (
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail?.split('@')[0] || 'User')}&background=E4281F&color=fff&size=80&bold=true`}
              alt="default avatar"
              className="w-full h-full object-cover"
            />
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
            id="avatar-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload avatar"
          >
            {uploading ? (
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg className="animate-spin h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-700">
            We'll only use this info to personalize your experience. Your details will be stored securely and won't be made public.
          </p>
        </div>
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
          <label className="block text-sm font-bold text-gray-900 mb-1">Title</label>
          <select
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">Select title</option>
            <option value="Mr">Mr</option>
            <option value="Ms">Ms</option>
            <option value="Mrs">Mrs</option>
            <option value="Dr">Dr</option>
            <option value="Prof">Prof</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Country/Region of Residence</label>
          <input
            type="text"
            value={countryRegion}
            onChange={(e) => setCountryRegion(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="e.g. Malaysia"
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
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Email</label>
          <input
            type="email"
            value={userEmail}
            disabled
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            placeholder="Email (managed in login settings)"
          />
          <p className="text-xs text-gray-500 mt-1">You can manage your email in login methods</p>
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


