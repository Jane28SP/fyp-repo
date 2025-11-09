import React from 'react';

const HeroBanner: React.FC = () => {

  const handleExploreEvents = () => {
    const eventListSection = document.getElementById('event-list-section');
    if (eventListSection) {
      eventListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl mb-12">
      {/* Banner Image Background */}
      <img 
        src="/fypBanner.png" 
        alt="Event Banner" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

      {/* Text Content */}
      <div className="absolute inset-0 flex items-end justify-center pb-16 px-8">
        <div className="text-center max-w-4xl">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
            Discover Your Next
            <div className="relative inline-block mx-2">
              <span className="relative z-10">Experience</span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
            </div>
          </h1>
          
          {/* Sub-headline */}
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed">
            Yoga, Talks, Workshops & More – All in One Place
          </p>
          
          {/* Call to action buttons */}
          <div className="mt-8 flex justify-center items-center">
            <button 
              onClick={handleExploreEvents}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 hover:shadow-cyan-500/25"
            >
              Explore Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
