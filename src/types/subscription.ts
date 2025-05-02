export enum SubscriptionPlanType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium'
}

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
  generationsPerMonth: number;
  enhancedDescriptions: boolean;
  projectsLimit: number;
}

export interface UserSubscription {
  userId: string;
  planId: SubscriptionPlanType;
  status: 'active' | 'canceled' | 'expired';
  startDate: { toDate: () => Date };
  endDate: { toDate: () => Date };
  generationsUsed: number;
  lastRenewal: { toDate: () => Date };
  paymentMethod?: string;
  autoRenew: boolean;
}

export interface SubscriptionCheckResult {
  canGenerate: boolean;
  reason?: string;
  subscription?: UserSubscription;
  plans: Record<SubscriptionPlanType, SubscriptionPlan>;
}
