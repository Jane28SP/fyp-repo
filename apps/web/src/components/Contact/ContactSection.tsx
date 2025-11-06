import React, { useState } from 'react';

const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    allowStorage: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your form submission logic here
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      allowStorage: false,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <div className="py-8 bg-white" style={{ maxHeight: '550px', minHeight: '500px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                We're here to help you succeed!
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-900 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="Jane Chia"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-900 mb-1">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@website.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-900 mb-1">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01x-555-5555"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-gray-900 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  placeholder="Your message..."
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="allowStorage"
                  name="allowStorage"
                  checked={formData.allowStorage}
                  onChange={handleChange}
                  className="mt-0.5 h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowStorage" className="ml-2 text-xs text-gray-700">
                  I allow this website to store my submission so they can respond to my inquiry.{' '}
                  <span className="text-red-500">*</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-2.5 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                SUBMIT
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            {/* Get in touch */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get in touch</h3>
              <div className="space-y-2">
                <a href="mailto:contactus@jomevent.com.my" className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contactus@jomevent.com.my
                </a>
                <a href="tel:+60381604033" className="flex items-center text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +603-8160 4033
                </a>
                <a href="tel:+60381609811" className="flex items-center text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +603-8160 9811
                </a>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Location</h3>
              <a href="https://maps.google.com/?q=28,+Jln+TPP+5,+Taman+Perindustrian+Putra,+47130+Puchong,+Selangor,+Malaysia" target="_blank" rel="noopener noreferrer" className="flex items-start text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="underline">28, Jln TPP 5, Taman Perindustrian Putra, 47130 Puchong, Selangor, Malaysia</span>
              </a>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hours</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Mon-Fri</span>
                  <span>9:00am - 10:00pm</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00am - 6:00pm</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;

