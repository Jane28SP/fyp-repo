import React from 'react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Brandon Vega',
      role: 'Tokyo Art Collective',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      text: 'JomEvent transformed the way we manage our events. The ease of posting and the smooth registration process has made our gatherings more organized and enjoyable for everyone involved.',
    },
    {
      id: 2,
      name: 'Chris Wei',
      role: 'Tokyo Tech Forum',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      text: 'As an attendee, I appreciate how JomEvent simplifies my experience. I can quickly find classes that interest me and register with just a few clicks, making event participation a breeze.',
    },
    {
      id: 3,
      name: 'Karen Weiss',
      role: 'Tokyo Startup Hub',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      text: "JomEvent's platform has streamlined our event planning process. The ability to generate QR codes for entry has significantly reduced check-in times and improved overall efficiency.",
    },
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h3 className="text-sm font-semibold text-green-600 tracking-wide uppercase mb-2">
            WHAT OUR USERS SAY
          </h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Join the community of satisfied event-goers!
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8"
            >
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-indigo-100"
                />
                <h4 className="text-xl font-bold text-gray-900">{testimonial.name}</h4>
                <p className="text-gray-600 text-sm">{testimonial.role}</p>
              </div>

              {/* Testimonial Text */}
              <div className="relative">
                <svg
                  className="absolute -top-2 -left-2 w-8 h-8 text-indigo-200 opacity-50"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm16 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
                </svg>
                <p className="text-gray-700 leading-relaxed relative z-10">
                  {testimonial.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;

