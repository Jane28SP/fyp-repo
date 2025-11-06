import React, { useState, useEffect } from 'react';
import { Event } from '../../lib/supabase';

interface EventCardProps {
  event: Event;
  onBook: (event: Event) => void;
  onAddToCart: (event: Event) => void;
  isBooked?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBook, onAddToCart, isBooked = false }) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'rgb(55, 109, 39)',
      'Business': 'bg-red-600',
      'Health & Wellness': 'bg-green-500',
      'Food & Drink': '#2f0bf5',
      'Music': '#231b09',
      'Education': '#6a2d7e',
    };
    return colors[category] || 'bg-red-500';
  };

  const getCategoryStyle = (category: string) => {
    const color = getCategoryColor(category);
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return { backgroundColor: color };
    }
    return {};
  };

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);

  useEffect(() => {
    const key = `eventReviews_${event.id}`;
    const reviews = JSON.parse(localStorage.getItem(key) || '[]');
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
      setAvgRating(parseFloat((sum / reviews.length).toFixed(1)));
      setRatingCount(reviews.length);
    } else {
      setAvgRating(null);
      setRatingCount(0);
    }
  }, [event.id]);

  return (
    <div 
      className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      {event.image_url && (
        <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          {event.category && (
            <div className="absolute top-4 right-4">
              <span 
                className={`px-4 py-1.5 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm ${getCategoryColor(event.category).startsWith('#') || getCategoryColor(event.category).startsWith('rgb') ? '' : getCategoryColor(event.category)}`}
                style={getCategoryStyle(event.category)}
              >
                {event.category}
              </span>
            </div>
          )}
          {event.price === 0 && (
            <div className="absolute top-4 left-4">
              <span className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                FREE
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center text-sm">
            <svg className="w-5 h-5 text-amber-500 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-gray-900">{formatDate(event.date)} • {formatTime(event.time)}</span>
          </div>
          
          <div className="flex items-start text-sm">
            <svg className="w-5 h-5 text-red-500 mr-2.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-gray-600 line-clamp-2">{event.location}</div>
          </div>

          <div className="flex items-center text-sm">
            {(() => {
              const filled = avgRating ? Math.round(avgRating) : 0;
              const stars = Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < filled ? 'text-amber-500' : 'text-gray-300'}>★</span>
              ));
              return (
                <>
                  <span className="mr-1">{stars}</span>
                  {avgRating !== null && (
                    <span className="ml-1 text-gray-700">
                      <span className="font-semibold">{avgRating}</span>
                      <span className="ml-1">/ 5</span>
                      <span className="ml-2 text-xs text-gray-500">({ratingCount})</span>
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-5 border-t border-amber-100">
          <div className="flex flex-col">
            {event.price === 0 ? (
              <div className="text-2xl font-bold text-green-600">Free</div>
            ) : (
              <>
                <div className="text-2xl font-bold" style={{ color: '#2b2b2b' }}>
                  RM {event.price}
                </div>
                <div className="text-xs text-gray-500 font-medium">per ticket</div>
              </>
            )}
          </div>
          
          <button
            onClick={() => onAddToCart(event)}
            className="relative px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: isCardHovered ? '#e4281f' : '#ffbe54' }}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Add to Cart</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 