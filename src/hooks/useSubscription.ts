import { useState, useEffect, useCallback } from 'react';
import { getSubscriptions } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export type PlanTier = 'free' | 'semilla' | 'guerrera' | 'diamante';

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  semilla: 1,
  guerrera: 2,
  diamante: 3,
};

interface SubscriptionState {
  plan: PlanTier;
  status: string;
  loading: boolean;
  isActive: boolean;
  isPremium: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    status: 'inactive',
    loading: true,
    isActive: false,
    isPremium: false,
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ plan: 'free', status: 'inactive', loading: false, isActive: false, isPremium: false });
      return;
    }
    try {
      const sub = await getSubscriptions(user.id);
      const plan = (sub?.plan || sub?.plan_id || 'free') as PlanTier;
      const status = sub?.status || 'inactive';
      const now = Date.now();

      const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
      const periodValid = periodEnd === null || (Number.isFinite(periodEnd) && periodEnd > now);

      const graceEnd = sub?.grace_period_end ? new Date(sub.grace_period_end).getTime() : null;
      const inGracePeriod = status === 'past_due' && graceEnd !== null && Number.isFinite(graceEnd) && graceEnd > now;

      const isActive =
        ((status === 'active' || status === 'trialing') && periodValid) || inGracePeriod;

      setState({ plan, status, loading: false, isActive, isPremium: isActive && plan !== 'free' });
    } catch {
      setState({ plan: 'free', status: 'inactive', loading: false, isActive: false, isPremium: false });
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const hasAccess = useCallback((requiredPlan: PlanTier) => {
    if (requiredPlan === 'free') return true;
    const currentTier = PLAN_HIERARCHY[state.plan] ?? 0;
    return state.isActive && currentTier >= PLAN_HIERARCHY[requiredPlan];
  }, [state.isActive, state.plan]);

  return { ...state, refresh, hasAccess };
}
