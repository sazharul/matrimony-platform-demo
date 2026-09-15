import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { getSettings, getPage } from '@/services/publicService';
import ContactForm from '@/components/public/ContactForm';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  try {
    const page = await getPage('contact_info');
    return {
      title: page.meta_title ?? `Contact Us — ${settings.site_name}`,
      description: page.meta_description ?? `Get in touch with ${settings.site_name} support team.`,
      openGraph: {
        title: page.meta_title ?? `Contact Us — ${settings.site_name}`,
        description: page.meta_description ?? '',
        type: 'website',
      },
    };
  } catch {
    return {
      title: `Contact Us — ${settings.site_name}`,
      description: `Get in touch with ${settings.site_name} support team. We are here to help.`,
      openGraph: {
        title: `Contact Us — ${settings.site_name}`,
        description: `Reach out to the ${settings.site_name} team.`,
        type: 'website',
      },
    };
  }
}

export default async function ContactPage() {
  const settings = await getSettings();

  let contactPage: Awaited<ReturnType<typeof getPage>> | null = null;
  try {
    contactPage = await getPage('contact_info');
  } catch {
    // Use settings defaults
  }

  const contactPageContent = contactPage?.content ?? '';

  const contactItems = [
    {
      icon: Mail,
      label: 'Email',
      value: settings.contact_email,
      href: settings.contact_email ? `mailto:${settings.contact_email}` : null,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: settings.contact_phone,
      href: settings.contact_phone ? `tel:${settings.contact_phone.replace(/\s/g, '')}` : null,
    },
    {
      icon: MapPin,
      label: 'Address',
      value: settings.contact_address,
      href: null,
    },
    {
      icon: Clock,
      label: 'Support Hours',
      value: 'Saturday – Thursday, 9 AM – 6 PM (BST)',
      href: null,
    },
  ].filter((item) => item.value);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${settings.site_name}`,
    description: `Contact and support page for ${settings.site_name} matrimony platform.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        className="py-14"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'var(--font-heading, serif)' }}
          >
            {contactPage?.title ?? 'Contact Us'}
          </h1>
          <p className="text-[#FFFFFF] mt-3">
            {contactPage?.meta_description ?? "We're here to help. Reach out anytime."}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            {contactItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4"
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,207,0,0.1)' }}
                  >
                    <Icon size={18} style={{ color: '#FFCF00' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#4A3F2E] mb-0.5">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm font-medium text-gray-800 hover:text-[#FFCF00] transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-800">{item.value}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Dynamic CMS content */}
            {contactPageContent && (
              <div
                className="bg-white rounded-2xl border border-gray-100 p-5 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contactPageContent }}
              />
            )}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}

