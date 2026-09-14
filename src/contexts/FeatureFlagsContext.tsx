import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

interface FeatureFlags {
  [key: string]: boolean;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  loading: boolean;
  isEnabled: (flagKey: string) => boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_FLAGS: FeatureFlags = {
  maintenance_mode: false,
  chat_ia: true,
  affiliates: true,
  courses: true,
  community: true,
  wellness_planner: true,
  growth_coach: true,
  push_notifications: true,
  weekly_challenges: true,
  dark_psychology: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: DEFAULT_FLAGS,
  loading: true,
  isEnabled: () => true,
  refresh: async () => {},
});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('yayika_feature_flags')
        .select('flag_key, is_enabled');

      if (error) throw error;

      if (data) {
        const flagMap: FeatureFlags = { ...DEFAULT_FLAGS };
        data.forEach((f: { flag_key: string; is_enabled: boolean }) => {
          flagMap[f.flag_key] = f.is_enabled;
        });
        setFlags(flagMap);
      }
    } catch (e) {
      console.log('[FeatureFlags] Using defaults:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    const interval = setInterval(fetchFlags, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (flagKey: string): boolean => {
      return flags[flagKey] === true;
    },
    [flags]
  );

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, refresh: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function useFeatureFlag(flagKey: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagKey);
}
