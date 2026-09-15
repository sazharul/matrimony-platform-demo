import type { PageListItem } from '@/types/page';

export interface NavLink {
  href: string;
  label: string;
}

/** Always-visible header links (Home, Search Profile, Membership). */
export const STATIC_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search Profile' },
  { href: '/plan', label: 'Membership' },
];

/** CMS slugs that must never appear in the menu (content-only pages). */
const EXCLUDED_MENU_SLUGS = new Set(['home_hero', 'pricing']);

/** Map CMS slugs to fixed frontend routes. */
const SLUG_ROUTE_MAP: Record<string, string> = {
  about: '/about',
  faq: '/faq',
  contact: '/contact',
  contact_info: '/contact',
  terms: '/terms',
  privacy_policy: '/privacy-policy',
  success_stories: '/success-stories',
  pricing: '/plan',
};

export function pageSlugToHref(slug: string): string {
  return SLUG_ROUTE_MAP[slug] ?? `/pages/${slug}`;
}

/** Static links first, then CMS pages with show_in_menu enabled (sorted by sort_order). */
export function buildNavLinks(menuPages: PageListItem[]): NavLink[] {
  const staticHrefs = new Set(STATIC_NAV_LINKS.map((link) => link.href));
  const seenHrefs = new Set(staticHrefs);

  const dynamicLinks = [...menuPages]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((page) => !EXCLUDED_MENU_SLUGS.has(page.slug))
    .map((page) => ({
      href: pageSlugToHref(page.slug),
      label: page.title,
    }))
    .filter((link) => {
      if (seenHrefs.has(link.href)) return false;
      seenHrefs.add(link.href);
      return true;
    });

  return [...STATIC_NAV_LINKS, ...dynamicLinks];
}

export function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href.startsWith('/#')) return pathname === '/';
  if (href.startsWith('/pages/')) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
