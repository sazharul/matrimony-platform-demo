/**
 * useSettings hook — client-side settings fetch.
 * Uses React Query (no auth needed) so the result is cached and shared
 * across all client components that call it.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import type { SiteSettings } from '@/types/settings';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'MatriConnect';

async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API_URL}/api/v1/settings`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  const json = await res.json();
  return json.data as SiteSettings;
}

const FALLBACK: SiteSettings = {
  site_name:        APP_NAME,
  site_slogan:      'Find Your Perfect Match',
  site_logo:        null,
  site_favicon:     null,
  currency:         'BDT',
  currency_symbol:  '৳',
  contact_email:    null,
  contact_phone:    null,
  contact_address:  null,
  face_scan_enabled: '1',
  email_verification_enabled: '1',
  facebook_url:     null,
  twitter_url:      null,
  instagram_url:    null,
  linkedin_url:     null,
  email_otp_expiry_minutes: '15',
  meta_title:       null,
  meta_description: null,
  meta_keywords:    null,
};

export function useSettings() {
  const { data, isLoading } = useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn:  fetchSettings,
    staleTime: 60_000,     // 60 s — consistent with server-side ISR revalidate
    gcTime:    300_000,    // 5 min cache
    retry: 1,
  });

  return {
    settings: data ?? FALLBACK,
    isLoading,
  };
}

