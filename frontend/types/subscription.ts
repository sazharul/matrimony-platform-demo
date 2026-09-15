// Feature key-value map: bool | number | string
export type FeatureValue = boolean | number | string;
export type PlanFeatures = Record<string, FeatureValue>;

export interface FeatureDefinition {
    label: string;
    type: 'bool' | 'qty' | 'enum';
    period?: string | null;
}

export type FeatureDefinitions = Record<string, FeatureDefinition>;

export interface PublicSubscriptionPlansPayload {
    plans: SubscriptionPlan[];
    feature_definitions: FeatureDefinitions;
}

export interface SubscriptionTypeRef {
    id: number;
    name: string;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    plan_type: string;
    price_bdt: number;
    duration_qty: number;
    duration_unit: 'hour' | 'day' | 'month' | 'year';
    /** @deprecated use duration_qty + duration_unit */
    duration_days?: number;
    /** Can be a key-value map (new format) or an array of feature strings (legacy format) */
    features: PlanFeatures | string[];
    is_active: boolean;
    sort_order: number;
    subscription_type?: SubscriptionTypeRef | null;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: number;
    user_id: number;
    subscription_plan_id: number | null;
    plan: string;
    amount_bdt: number;
    payment_method: string;
    transaction_id: string;
    status: 'pending' | 'active' | 'expired' | 'refunded';
    starts_at: string | null;
    expires_at: string | null;
    created_at: string;
    subscription_plan?: SubscriptionPlan | null;
}

/** One entry in the switchable list returned by status API */
export interface SwitchableSubscription {
    id: number;
    subscription_plan_id: number | null;
    plan: string;
    amount_bdt: number;
    expires_at: string;
    is_current: boolean;
    subscription_plan: SubscriptionPlan | null;
}

export interface SubscriptionStatus {
    plan: string;
    expires_at: string | null;
    is_active: boolean;
    active_subscription_id: number | null;
    subscription: Subscription | null;
    switchable: SwitchableSubscription[];
    features: PlanFeatures;
}

export interface PaymentHistoryItem {
    id: number;
    plan_name: string;
    plan_type: string;
    amount_bdt: number;
    payment_method: string;
    transaction_id: string;
    status: 'pending' | 'active' | 'expired' | 'refunded';
    starts_at: string | null;
    expires_at: string | null;
    created_at: string;
    is_current: boolean;
    is_switchable: boolean;
    subscription_plan: SubscriptionPlan | null;
}

export interface InitiatePaymentResponse {
    payment_url: string;
    transaction_id: string;
}

export interface SubscribeFreeResponse {
    subscription: Subscription;
    plan: string;
    expires_at: null;
}

export interface SwitchPlanResponse {
    active_subscription_id: number;
    plan: string;
    expires_at: string;
    subscription_plan: SubscriptionPlan | null;
}
