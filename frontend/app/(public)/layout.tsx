import type { ReactNode } from 'react';
import { getSettings, getMenuPages } from '@/services/publicService';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { buildNavLinks } from '@/lib/publicNav';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [settings, menuPages] = await Promise.all([getSettings(), getMenuPages()]);
  const navLinks = buildNavLinks(menuPages);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FB' }}>
      <Navbar
        siteName={settings.site_name}
        siteSlogan={settings.site_slogan}
        logoUrl={settings.site_logo}
        navLinks={navLinks}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}

