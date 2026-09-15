export interface SiteSettings {
    site_name: string;
    site_slogan: string | null;
    site_logo: string | null;
    site_favicon: string | null;
    currency: string;
    currency_symbol: string;
    contact_email: string | null;
    contact_phone: string | null;
    contact_address: string | null;
    face_scan_enabled: string | null;
    email_verification_enabled: string | null;
    facebook_url: string | null;
    twitter_url: string | null;
    instagram_url: string | null;
    linkedin_url: string | null;
    email_otp_expiry_minutes: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
}

