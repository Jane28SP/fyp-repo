import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Navigate } from 'react-router-dom';

interface OrganizerRouteProps {
  children: React.ReactNode;
}

const OrganizerRoute: React.FC<OrganizerRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    checkOrganizerStatus();
  }, []);

  const checkOrganizerStatus = async () => {
    try {
      // Check if we're in mock mode
      const mockUser = localStorage.getItem('mockUser');
      const mockUserType = localStorage.getItem('mockUserType');
      
      if (mockUser && mockUserType === 'organizer') {
        console.log('OrganizerRoute: Mock organizer detected');
        setIsOrganizer(true);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('OrganizerRoute: No user found');
        setLoading(false);
        return;
      }

      const { data: organizer } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('OrganizerRoute: Organizer check result:', !!organizer);
      setIsOrganizer(!!organizer);
    } catch (error) {
      console.error('OrganizerRoute: Failed to check organizer status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isOrganizer) {
    return <Navigate to="/organizer/login" replace />;
  }

  return <>{children}</>;
};

export default OrganizerRoute;
