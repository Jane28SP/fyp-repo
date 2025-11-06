import React, { useState, useRef } from 'react';
import { Event, uploadEventImage, createImageDataUrl } from '../../lib/supabase';

interface EventFormProps {
  event?: Event;
  onSubmit: (eventData: Partial<Event>) => Promise<void>;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || '',
    time: event?.time || '',
    location: event?.location || '',
    capacity: event?.capacity || 0,
    price: event?.price || 0,
    category: event?.category || 'Technology',
    image_url: event?.image_url || '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(event?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'price' ? parseFloat(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');
      
      // Create preview first (so user can see the image even if upload fails)
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        
        // If we're in a situation where storage might not be available,
        // we can use the data URL as a fallback (though it's large, it works)
        // This will be used only if upload fails
        if (dataUrl) {
          // Store data URL temporarily - will be replaced by storage URL if upload succeeds
          setFormData(prev => ({
            ...prev,
            image_url: dataUrl,
          }));
        }
      };
      reader.readAsDataURL(file);

      // Try to upload to Supabase Storage
      try {
        const imageUrl = await uploadEventImage(file, event?.id);
        // If upload succeeds, use the storage URL (better than data URL)
        setFormData(prev => ({
          ...prev,
          image_url: imageUrl,
        }));
        // Update preview to storage URL
        setImagePreview(imageUrl);
      } catch (uploadError: any) {
        // Upload failed - check if it's a bucket error
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket')) {
          // For bucket errors, keep the data URL preview and show helpful message
          setError(
            uploadError.message + ' ' +
            'The image preview is shown below using a data URL. ' +
            'You can continue with this, or paste an external image URL instead.'
          );
          // Preview already set to data URL above, so keep it
        } else {
          // Other errors - still show preview but warn user
          setError(
            uploadError.message || 'Failed to upload image. ' +
            'Preview is shown below using a data URL. ' +
            'You can continue with this, or use an external image URL instead.'
          );
        }
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      setError(error.message || 'Failed to process image. Please try a different image or use an image URL instead.');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      image_url: value,
    }));
    setImagePreview(value || null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await onSubmit(formData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Technology',
    'Business',
    'Health & Wellness',
    'Food & Drink',
    'Music',
    'Arts & Culture',
    'Sports',
    'Education',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Event Name
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Event Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Time
            </label>
            <input
              type="text"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              placeholder="14:00-16:00"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-300"
              />
            </div>
          )}

          {/* Upload Button */}
          <div className="mb-3">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploadingImage || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload an image file (max 5MB) or use URL below. 
              <span className="block mt-1 text-gray-400">
                📐 Recommended size: 1200x600px (16:9 aspect ratio) for best display quality
              </span>
            </p>
          </div>

          {/* Image URL Input */}
          <div>
            <label htmlFor="image_url_input" className="block text-sm font-medium text-gray-700 mb-1">
              Or Enter Image URL
            </label>
            <input
              type="url"
              id="image_url_input"
              name="image_url"
              value={formData.image_url || ''}
              onChange={handleImageUrlChange}
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
