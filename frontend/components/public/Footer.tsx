import Link from 'next/link';
import {Mail, Phone, MapPin} from 'lucide-react';
import type {SiteSettings} from '@/types/settings';
import {cfImageUrl} from '@/lib/utils';
import {getPages} from '@/services/publicService';
import {pageSlugToHref} from '@/lib/publicNav';

interface FooterProps {
    settings: SiteSettings;
}

/** CMS slugs that are content blocks, not navigable footer links. */
const EXCLUDED_FOOTER_SLUGS = new Set(['home_hero']);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
);
const TwitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);
const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
);
const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
    </svg>
);

const SOCIAL_LINKS: {
    key: keyof Pick<SiteSettings, 'facebook_url' | 'twitter_url' | 'instagram_url' | 'linkedin_url'>;
    Icon: () => React.JSX.Element;
}[] = [
    {key: 'facebook_url', Icon: FacebookIcon},
    {key: 'twitter_url', Icon: TwitterIcon},
    {key: 'instagram_url', Icon: InstagramIcon},
    {key: 'linkedin_url', Icon: LinkedInIcon},
];

export default async function Footer({settings}: FooterProps) {
    const currentYear = new Date().getFullYear();
    const configuredSocial = SOCIAL_LINKS.filter(({key}) => settings[key]);

    const cmsPages = await getPages();
    const quickLinks = cmsPages
        .filter((page) => !EXCLUDED_FOOTER_SLUGS.has(page.slug))
        .sort((a, b) => a.sort_order - b.sort_order);

    return (
        <footer style={{background: '#1a1a2e'}} className="text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-3">
                            {settings.site_logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={cfImageUrl(settings.site_logo) ?? ''}
                                    alt={settings.site_name}
                                    className="h-9 w-auto object-contain rounded-lg"
                                />
                            ) : (
                                <span className="font-semibold text-base"
                                      style={{fontFamily: 'var(--font-heading, serif)'}}>
                                    {settings.site_name}
                                </span>
                            )}
                        </div>
                        {settings.site_slogan && (
                            <p className="text-white font-medium text-sm leading-relaxed max-w-xs">
                                {settings.site_slogan}
                            </p>
                        )}
                        {configuredSocial.length > 0 && (
                            <div className="flex items-center gap-3 mt-4">
                                {configuredSocial.map(({key, Icon}) => (
                                    <a
                                        key={key}
                                        href={settings[key]!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white hover:text-[#FFCF00] transition-colors"
                                        aria-label={key.replace('_url', '')}
                                    >
                                        <Icon/>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider mb-4" style={{color: '#FFCF00'}}>
                            Quick Links
                        </h4>
                        {quickLinks.length > 0 ? (
                            <ul className="space-y-2">
                                {quickLinks.map((page) => (
                                    <li key={page.id}>
                                        <Link
                                            href={pageSlugToHref(page.slug)}
                                            className="text-white font-medium text-sm hover:text-[#FFCF00] transition-colors"
                                        >
                                            {page.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-sm">No pages available.</p>
                        )}
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider mb-4" style={{color: '#FFCF00'}}>
                            Contact Us
                        </h4>
                        <ul className="space-y-3">
                            {settings.contact_email && (
                                <li className="flex items-center gap-2 text-white font-medium text-sm">
                                    <Mail size={15} className="shrink-0" style={{color: '#FFCF00'}}/>
                                    <a href={`mailto:${settings.contact_email}`}
                                       className="hover:text-[#FFCF00] transition-colors">
                                        {settings.contact_email}
                                    </a>
                                </li>
                            )}
                            {settings.contact_phone && (
                                <li className="flex items-center gap-2 text-white font-medium text-sm">
                                    <Phone size={15} className="shrink-0" style={{color: '#FFCF00'}}/>
                                    <a href={`tel:${settings.contact_phone.replace(/\s/g, '')}`}
                                       className="hover:text-[#FFCF00] transition-colors">
                                        {settings.contact_phone}
                                    </a>
                                </li>
                            )}
                            {settings.contact_address && (
                                <li className="flex items-start gap-2 text-white font-medium text-sm">
                                    <MapPin size={15} className="shrink-0 mt-0.5" style={{color: '#FFCF00'}}/>
                                    <span>{settings.contact_address}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div
                    className="mt-10 pt-6 flex justify-center text-gray-400 font-medium text-xs"
                    style={{borderTop: '1px solid rgba(255,255,255,0.08)'}}
                >
                    <p>© {currentYear} {settings.site_name}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
