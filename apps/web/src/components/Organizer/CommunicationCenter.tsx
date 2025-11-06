import React, { useState } from 'react';
import { Event, Booking } from '../../lib/supabase';

interface CommunicationCenterProps {
  events: Event[];
  bookings: Booking[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'reminder' | 'update' | 'feedback' | 'custom';
}

interface Survey {
  id: string;
  title: string;
  questions: { id: string; question: string; type: 'text' | 'rating' | 'multiple' }[];
  eventId: string;
  responses: number;
  status: 'draft' | 'active' | 'closed';
}

const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ events, bookings }) => {
  const [activeTab, setActiveTab] = useState<'emails' | 'notifications' | 'surveys'>('emails');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [emailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Event Reminder',
      subject: 'Don\'t forget: {{eventTitle}} is tomorrow!',
      content: 'Hi {{attendeeName}},\n\nThis is a friendly reminder that {{eventTitle}} is happening tomorrow at {{eventTime}}.\n\nLocation: {{eventLocation}}\n\nWe look forward to seeing you there!\n\nBest regards,\nThe Event Team',
      type: 'reminder'
    },
    {
      id: '2',
      name: 'Event Update',
      subject: 'Important update for {{eventTitle}}',
      content: 'Hi {{attendeeName}},\n\nWe have an important update regarding {{eventTitle}}:\n\n{{updateContent}}\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\nThe Event Team',
      type: 'update'
    },
    {
      id: '3',
      name: 'Feedback Request',
      subject: 'How was your experience at {{eventTitle}}?',
      content: 'Hi {{attendeeName}},\n\nThank you for attending {{eventTitle}}! We hope you had a great time.\n\nWe\'d love to hear your feedback to help us improve future events. Please take a few minutes to share your thoughts:\n\n{{surveyLink}}\n\nThank you for your time!\n\nBest regards,\nThe Event Team',
      type: 'feedback'
    }
  ]);

  const [surveys] = useState<Survey[]>([
    {
      id: '1',
      title: 'Event Experience Survey',
      questions: [
        { id: '1', question: 'How would you rate your overall experience?', type: 'rating' },
        { id: '2', question: 'What did you like most about the event?', type: 'text' },
        { id: '3', question: 'How likely are you to attend future events?', type: 'rating' },
        { id: '4', question: 'Any suggestions for improvement?', type: 'text' }
      ],
      eventId: events[0]?.id || '',
      responses: 45,
      status: 'active'
    }
  ]);

  const [emailForm, setEmailForm] = useState({
    recipients: 'all',
    template: '',
    customSubject: '',
    customContent: '',
    scheduledTime: ''
  });

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    scheduledTime: ''
  });

  const sendEmail = () => {
    console.log('Sending email:', emailForm);
    alert('Email sent successfully! (This is a demo - in a real app, this would integrate with email service)');
    setEmailForm({
      recipients: 'all',
      template: '',
      customSubject: '',
      customContent: '',
      scheduledTime: ''
    });
  };

  const sendNotification = () => {
    console.log('Sending push notification:', notificationForm);
    alert('Push notification sent! (This is a demo - in a real app, this would integrate with Firebase Cloud Messaging)');
    setNotificationForm({
      title: '',
      message: '',
      targetAudience: 'all',
      scheduledTime: ''
    });
  };

  const createSurvey = () => {
    alert('Survey created! (This is a demo - in a real app, this would save to database)');
  };

  const getEventAttendees = (eventId: string) => {
    return bookings.filter(b => b.event_id === eventId && b.status !== 'cancelled').length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Communication Center</h2>
        
        {/* Event Selection */}
        <div className="mb-6">
          <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Select Event
          </label>
          <select
            id="eventSelect"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title} ({getEventAttendees(event.id)} attendees)
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {['emails', 'notifications', 'surveys'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'emails' ? 'Email Campaigns' : tab === 'notifications' ? 'Push Notifications' : 'Surveys'}
            </button>
          ))}
        </nav>
      </div>

      {/* Email Tab */}
      {activeTab === 'emails' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Email Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Email Campaign</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients
                </label>
                <select
                  value={emailForm.recipients}
                  onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Attendees</option>
                  <option value="confirmed">Confirmed Attendees</option>
                  <option value="checked_in">Checked-in Attendees</option>
                  <option value="going">RSVP: Going</option>
                  <option value="maybe">RSVP: Maybe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Template
                </label>
                <select
                  value={emailForm.template}
                  onChange={(e) => setEmailForm({...emailForm, template: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Custom Email</option>
                  {emailTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailForm.customSubject}
                  onChange={(e) => setEmailForm({...emailForm, customSubject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailForm.customContent}
                  onChange={(e) => setEmailForm({...emailForm, customContent: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Send (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={emailForm.scheduledTime}
                  onChange={(e) => setEmailForm({...emailForm, scheduledTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={sendEmail}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {emailForm.scheduledTime ? 'Schedule Email' : 'Send Now'}
              </button>
            </div>
          </div>

          {/* Email Templates */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
            <div className="space-y-4">
              {emailTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                      template.type === 'update' ? 'bg-blue-100 text-blue-800' :
                      template.type === 'feedback' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                  <p className="text-xs text-gray-500 line-clamp-3">{template.content}</p>
                  <button
                    onClick={() => setEmailForm({
                      ...emailForm,
                      template: template.id,
                      customSubject: template.subject,
                      customContent: template.content
                    })}
                    className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Push Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Send Push Notification</h3>
          
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Notification message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                value={notificationForm.targetAudience}
                onChange={(e) => setNotificationForm({...notificationForm, targetAudience: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Attendees</option>
                <option value="confirmed">Confirmed Attendees</option>
                <option value="going">RSVP: Going</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Send (Optional)
              </label>
              <input
                type="datetime-local"
                value={notificationForm.scheduledTime}
                onChange={(e) => setNotificationForm({...notificationForm, scheduledTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={sendNotification}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {notificationForm.scheduledTime ? 'Schedule Notification' : 'Send Now'}
            </button>
          </div>
        </div>
      )}

      {/* Surveys Tab */}
      {activeTab === 'surveys' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Survey Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Feedback Survey</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Survey Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Event Experience Survey"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Event
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Survey Questions
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="How would you rate your overall experience?"
                  />
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="What did you like most about the event?"
                  />
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    + Add Question
                  </button>
                </div>
              </div>

              <button
                onClick={createSurvey}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Create Survey
              </button>
            </div>
          </div>

          {/* Active Surveys */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Surveys</h3>
            <div className="space-y-4">
              {surveys.map((survey) => (
                <div key={survey.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{survey.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      survey.status === 'active' ? 'bg-green-100 text-green-800' :
                      survey.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {survey.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {survey.questions.length} questions • {survey.responses} responses
                  </p>
                  <div className="flex space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View Results
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationCenter;
