import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';

export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pathname = usePathname();

  // Initialize sessionId from localStorage or generate new one
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let id = localStorage.getItem('session_id');
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('session_id', id);
    }
    setSessionId(id);
  }, []);

  // Update activity when page changes or on mount
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    const updateActivity = async () => {
      if (!isMounted) return;
      
      try {
        await axios.post('/api/active-users', {
          sessionId,
          page: pathname,
        }, {
          timeout: 5000, // 5 second timeout
        });
      } catch (error: any) {
        // Silently ignore abort errors
        if (error.code !== 'ECONNRESET' && error.code !== 'ECONNABORTED') {
          console.error('Failed to update activity:', error);
        }
      }
    };

    // Update immediately
    updateActivity();

    // Update every 2 minutes to keep session alive
    const activityInterval = setInterval(updateActivity, 120000); // 2 minutes

    return () => {
      isMounted = false;
      clearInterval(activityInterval);
    };
  }, [sessionId, pathname]);

  // Poll for active users count
  useEffect(() => {
    let isMounted = true;

    const fetchActiveUsers = async () => {
      if (!isMounted) return;

      try {
        const response = await axios.get('/api/active-users', {
          timeout: 5000, // 5 second timeout
        });
        
        if (isMounted && response.data.success) {
          setActiveUsers(response.data.activeUsers || 0);
        }
      } catch (error: any) {
        // Silently ignore timeout/abort errors
        if (!error.code || (error.code !== 'ECONNRESET' && error.code !== 'ECONNABORTED')) {
          console.error('Failed to fetch active users:', error);
        }
      }
    };

    // Fetch immediately after a short delay to let the POST complete
    const initialTimeout = setTimeout(fetchActiveUsers, 1000);

    // Poll every 30 seconds
    const pollInterval = setInterval(fetchActiveUsers, 30000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(pollInterval);
    };
  }, []);

  return activeUsers;
}

