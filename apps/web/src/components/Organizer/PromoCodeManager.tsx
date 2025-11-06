import React, { useState, useEffect, useMemo } from 'react';
import type { PromoCode, Event } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface PromoCodeManagerProps {
  events: Event[];
  organizerId: string;
  useMockMode?: boolean;
}

const PromoCodeManager: React.FC<PromoCodeManagerProps> = ({ events, organizerId, useMockMode = false }) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [usageFilter, setUsageFilter] = useState<'all' | 'available' | 'used_up'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_purchase: 0,
    max_discount: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage_limit: 0,
    event_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, [organizerId]);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      if (useMockMode) {
        const mockCodes = JSON.parse(localStorage.getItem('mockPromoCodes') || '[]');
        setPromoCodes(mockCodes.filter((c: PromoCode) => c.organizer_id === organizerId));
      } else {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('organizer_id', organizerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPromoCodes(data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Helper function to format date to DD/MM/YY
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Helper function to check if promo code is expired
  const isExpired = (validUntil: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const untilDate = new Date(validUntil);
    untilDate.setHours(0, 0, 0, 0);
    return untilDate < today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validFrom = new Date(formData.valid_from);
    validFrom.setHours(0, 0, 0, 0);
    const validUntil = new Date(formData.valid_until);
    validUntil.setHours(0, 0, 0, 0);

    if (validFrom < today) {
      alert('Valid From date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (validUntil < today) {
      alert('Valid Until date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (validUntil < validFrom) {
      alert('Valid Until date must be after Valid From date.');
      return;
    }

    try {
      setLoading(true);
      const promoCodeData: Partial<PromoCode> = {
        ...formData,
        code: formData.code || generateCode(),
        organizer_id: organizerId,
        usage_count: editingCode?.usage_count || 0,
        event_id: formData.event_id || undefined,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
      };

      if (useMockMode) {
        const mockCodes = JSON.parse(localStorage.getItem('mockPromoCodes') || '[]');
        if (editingCode) {
          const updated = mockCodes.map((c: PromoCode) =>
            c.id === editingCode.id ? { ...c, ...promoCodeData } : c
          );
          localStorage.setItem('mockPromoCodes', JSON.stringify(updated));
        } else {
          const newCode: PromoCode = {
            id: `promo-${Date.now()}`,
            ...promoCodeData,
            created_at: new Date().toISOString(),
          } as PromoCode;
          mockCodes.push(newCode);
          localStorage.setItem('mockPromoCodes', JSON.stringify(mockCodes));
        }
      } else {
        if (editingCode) {
          const { error } = await supabase
            .from('promo_codes')
            .update(promoCodeData)
            .eq('id', editingCode.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('promo_codes')
            .insert([promoCodeData]);
          if (error) throw error;
        }
      }

      setShowForm(false);
      setEditingCode(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase: 0,
        max_discount: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usage_limit: 0,
        event_id: '',
        is_active: true,
      });
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Failed to save promo code:', error);
      alert(error.message || 'Failed to save promo code');
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate promo codes
  const filteredAndPaginatedCodes = useMemo(() => {
    let filtered = [...promoCodes];

    // Helper function to check if promo code is expired (inline to avoid dependency)
    const checkExpired = (validUntil: string): boolean => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const untilDate = new Date(validUntil);
      untilDate.setHours(0, 0, 0, 0);
      return untilDate < today;
    };

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(code => {
        const expired = checkExpired(code.valid_until);
        if (statusFilter === 'expired') {
          return expired;
        } else if (statusFilter === 'active') {
          return !expired && code.is_active;
        } else if (statusFilter === 'inactive') {
          return !expired && !code.is_active;
        }
        return true;
      });
    }

    // Discount type filter
    if (discountTypeFilter !== 'all') {
      filtered = filtered.filter(code => code.discount_type === discountTypeFilter);
    }

    // Usage filter
    if (usageFilter !== 'all') {
      filtered = filtered.filter(code => {
        const usageLimit = code.usage_limit || 0;
        const usageCount = code.usage_count || 0;
        if (usageFilter === 'used_up') {
          return usageLimit > 0 && usageCount >= usageLimit;
        } else if (usageFilter === 'available') {
          return usageLimit === 0 || usageCount < usageLimit;
        }
        return true;
      });
    }

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      filtered,
      paginated,
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalCount: filtered.length
    };
  }, [promoCodes, statusFilter, discountTypeFilter, usageFilter, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, discountTypeFilter, usageFilter]);

  const toggleActive = async (code: PromoCode) => {
    try {
      const updated = { ...code, is_active: !code.is_active };
      if (useMockMode) {
        const mockCodes = JSON.parse(localStorage.getItem('mockPromoCodes') || '[]');
        const updatedCodes = mockCodes.map((c: PromoCode) =>
          c.id === code.id ? updated : c
        );
        localStorage.setItem('mockPromoCodes', JSON.stringify(updatedCodes));
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .update({ is_active: updated.is_active })
          .eq('id', code.id);
        if (error) throw error;
      }
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Failed to toggle promo code:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Promo Codes & Vouchers</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCode(null);
            setFormData({
              code: '',
              description: '',
              discount_type: 'percentage',
              discount_value: 10,
              min_purchase: 0,
              max_discount: 0,
              valid_from: new Date().toISOString().split('T')[0],
              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              usage_limit: 0,
              event_id: '',
              is_active: true,
            });
          }}
          className="px-4 py-2 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          style={{ backgroundColor: '#E4281F' }}
        >
          + Create Promo Code
        </button>
      </div>

      {showForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCode ? 'Edit Promo Code' : 'Create New Promo Code'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code (leave empty to auto-generate)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Auto-generate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (RM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event (Optional)</label>
                <select
                  value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                <input
                  type="date"
                  value={formData.valid_from}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = new Date().toISOString().split('T')[0];
                    if (selectedDate < today) {
                      alert('Valid From date cannot be in the past. Please select today or a future date.');
                      return;
                    }
                    setFormData({ ...formData, valid_from: selectedDate });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={formData.valid_until}
                  min={formData.valid_from || new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = new Date().toISOString().split('T')[0];
                    const validFrom = formData.valid_from || today;
                    
                    if (selectedDate < today) {
                      alert('Valid Until date cannot be in the past. Please select today or a future date.');
                      return;
                    }
                    if (selectedDate < validFrom) {
                      alert('Valid Until date must be after Valid From date.');
                      return;
                    }
                    setFormData({ ...formData, valid_until: selectedDate });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase (RM)</label>
                <input
                  type="number"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (RM)</label>
                <input
                  type="number"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="0 = unlimited"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCode(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white rounded-md font-medium"
                style={{ backgroundColor: '#E4281F' }}
              >
                {loading ? 'Saving...' : editingCode ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
            <select
              value={discountTypeFilter}
              onChange={(e) => setDiscountTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usage</label>
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="used_up">Used Up</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredAndPaginatedCodes.paginated.length} of {filteredAndPaginatedCodes.totalCount} vouchers
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Discount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Valid Period</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAndPaginatedCodes.paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {promoCodes.length === 0 
                      ? 'No promo codes yet. Create your first one!'
                      : 'No vouchers match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredAndPaginatedCodes.paginated.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{code.code}</div>
                      {code.description && (
                        <div className="text-xs text-gray-500">{code.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {code.discount_type === 'percentage'
                          ? `${code.discount_value}%`
                          : `RM ${code.discount_value}`}
                      </div>
                      {code.event_id && (
                        <div className="text-xs text-gray-500">
                          {events.find(e => e.id === code.event_id)?.title || 'Unknown Event'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(code.valid_from)} - {formatDate(code.valid_until)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {code.usage_count} / {code.usage_limit || '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const expired = isExpired(code.valid_until);
                        if (expired) {
                          return (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700">
                              Expired
                            </span>
                          );
                        }
                        return (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            code.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                          }`}>
                            {code.is_active ? 'Active' : 'Inactive'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(() => {
                        const expired = isExpired(code.valid_until);
                        if (expired) {
                          return (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-gray-400 cursor-not-allowed">Deactivate</span>
                              <span className="text-gray-400 cursor-not-allowed">Edit</span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleActive(code)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {code.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCode(code);
                                setFormData({
                                  code: code.code,
                                  description: code.description || '',
                                  discount_type: code.discount_type,
                                  discount_value: code.discount_value,
                                  min_purchase: code.min_purchase || 0,
                                  max_discount: code.max_discount || 0,
                                  valid_from: new Date(code.valid_from).toISOString().split('T')[0],
                                  valid_until: new Date(code.valid_until).toISOString().split('T')[0],
                                  usage_limit: code.usage_limit || 0,
                                  event_id: code.event_id || '',
                                  is_active: code.is_active,
                                });
                                setShowForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredAndPaginatedCodes.totalPages > 1 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {filteredAndPaginatedCodes.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, filteredAndPaginatedCodes.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (filteredAndPaginatedCodes.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= filteredAndPaginatedCodes.totalPages - 2) {
                    pageNum = filteredAndPaginatedCodes.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(filteredAndPaginatedCodes.totalPages, prev + 1))}
                disabled={currentPage === filteredAndPaginatedCodes.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManager;

