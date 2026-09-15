'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function ContactForm() {
  const [form, setForm] = useState<ContactFormData>({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        // Laravel validation errors come in json.errors as { field: [msg] }
        const firstError = json.errors
          ? Object.values(json.errors as Record<string, string[]>).flat()[0]
          : (json.message ?? 'Something went wrong. Please try again.');
        setError(firstError);
        return;
      }

      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-10">
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#FFCF00' }} />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Message Received!</h3>
        <p className="text-meta">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
        <button
          className="mt-6 text-sm font-medium px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: '#FFCF00', color: '#FFCF00' }}
          onClick={() => setSent(false)}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{ borderColor: '#e5e7eb' }}
            onFocus={(e) => (e.target.style.borderColor = '#FFCF00')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{ borderColor: '#e5e7eb' }}
            onFocus={(e) => (e.target.style.borderColor = '#FFCF00')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject *</label>
        <input
          type="text"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
          style={{ borderColor: '#e5e7eb' }}
          onFocus={(e) => (e.target.style.borderColor = '#FFCF00')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          placeholder="How can we help you?"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none"
          style={{ borderColor: '#e5e7eb' }}
          onFocus={(e) => (e.target.style.borderColor = '#FFCF00')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          placeholder="Write your message here…"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-[#1A1208] text-sm transition-opacity disabled:opacity-70"
        style={{ background: 'linear-gradient(135deg, #FFCF00, #FFE033)' }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Sending…
          </>
        ) : (
          <><Send size={16} /> Send Message</>
        )}
      </button>
    </form>
  );
}
