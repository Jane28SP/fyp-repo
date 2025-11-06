import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const About: React.FC = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'about' | 'privacy' | 'terms' | 'cookies'>('about');

  useEffect(() => {
    // Handle hash navigation from footer links
    const hash = location.hash.slice(1); // Remove the '#'
    if (hash === 'privacy' || hash === 'terms' || hash === 'cookies') {
      setActiveSection(hash);
    } else {
      // Default to 'about' if no hash or hash is 'about'
      setActiveSection('about');
    }
    // Always scroll to top when navigating to this page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveSection('about')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'about'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => setActiveSection('privacy')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'privacy'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveSection('terms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'terms'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveSection('cookies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'cookies'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeSection === 'about' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">About Us</h1>
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-700 mb-6">
                Bringing the world together through live experiences.
              </p>
              <p className="text-gray-600 mb-4">
                JomEvent! is your one-stop platform for discovering and organizing amazing events. 
                We connect event organizers with attendees, making it easy to create, promote, and attend 
                memorable experiences.
              </p>
              <p className="text-gray-600 mb-4">
                Our mission is to empower communities by providing a seamless platform where creativity meets 
                opportunity. Whether you're looking to attend a technology conference, join a music festival, 
                participate in a business networking event, or organize your own gathering, JomEvent! is here 
                to make it happen.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Values</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Community First: We believe in bringing people together</li>
                <li>Innovation: Constantly improving our platform for better user experience</li>
                <li>Accessibility: Making events accessible to everyone</li>
                <li>Trust: Building a reliable and secure platform for all users</li>
              </ul>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-2">
                <strong>Address:</strong> 28, Jln TPP 5, Taman Perindustrian Putra, 47130 Puchong, Selangor, Malaysia
              </p>
              <p className="text-gray-600">
                For inquiries, please visit our <Link to="/" className="text-red-600 hover:underline">Contact</Link> page.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last Updated:</strong> January 2025
              </p>
              <p className="text-gray-600 mb-4">
                At JomEvent!, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
              <p className="text-gray-600 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Account information (name, email address, password)</li>
                <li>Event booking and transaction information</li>
                <li>Profile information and preferences</li>
                <li>Communication data when you contact us</li>
              </ul>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Your Rights</h2>
              <p className="text-gray-600 mb-4">
                You have the right to access, update, or delete your personal information at any time 
                through your account settings or by contacting us directly.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'terms' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last Updated:</strong> January 2025
              </p>
              <p className="text-gray-600 mb-4">
                Please read these Terms of Service carefully before using JomEvent!. By accessing or using 
                our platform, you agree to be bound by these terms.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By creating an account or using JomEvent!, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">User Accounts</h2>
              <p className="text-gray-600 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for 
                all activities that occur under your account.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Event Listings</h2>
              <p className="text-gray-600 mb-4">
                Organizers are responsible for the accuracy of their event listings and for ensuring their 
                events comply with all applicable laws and regulations.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Payments and Refunds</h2>
              <p className="text-gray-600 mb-4">
                All ticket purchases are final unless otherwise stated by the event organizer. Refund 
                policies are determined by individual event organizers.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Prohibited Activities</h2>
              <p className="text-gray-600 mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Use the platform for any illegal purpose</li>
                <li>Post false, misleading, or fraudulent information</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with the platform's security or functionality</li>
              </ul>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                JomEvent! shall not be liable for any indirect, incidental, special, or consequential 
                damages arising from your use of the platform.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'cookies' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last Updated:</strong> January 2025
              </p>
              <p className="text-gray-600 mb-4">
                This Cookie Policy explains how JomEvent! uses cookies and similar technologies to recognize 
                you when you visit our website.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What Are Cookies?</h2>
              <p className="text-gray-600 mb-4">
                Cookies are small text files that are placed on your device when you visit a website. 
                They are widely used to make websites work more efficiently and provide information to 
                the website owners.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Cookies</h2>
              <p className="text-gray-600 mb-4">We use cookies for the following purposes:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Authentication:</strong> To keep you logged in and secure your session</li>
                <li><strong>Preferences:</strong> To remember your settings and preferences</li>
                <li><strong>Analytics:</strong> To understand how visitors use our platform</li>
              </ul>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Managing Cookies</h2>
              <p className="text-gray-600 mb-4">
                You can control and manage cookies through your browser settings. However, disabling 
                certain cookies may impact your experience on our platform.
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Third-Party Cookies</h2>
              <p className="text-gray-600 mb-4">
                Some cookies may be set by third-party services that appear on our pages. We do not 
                control these cookies and recommend reviewing the privacy policies of these third parties.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;

