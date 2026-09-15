'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const religions = ['Any', 'Muslim', 'Hindu', 'Christian', 'Buddhist', 'Other'];
const ageOptions = Array.from({ length: 29 }, (_, i) => String(i + 18));

export default function HeroSearchForm() {
    const router = useRouter();
    const [lookingFor, setLookingFor] = useState<'bride' | 'groom'>('bride');
    const [ageMin, setAgeMin] = useState('22');
    const [ageMax, setAgeMax] = useState('30');
    const [religion, setReligion] = useState('Any');

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set('gender', lookingFor === 'bride' ? 'female' : 'male');
        params.set('age_min', ageMin);
        params.set('age_max', ageMax);
        if (religion !== 'Any') params.set('religion', religion.toLowerCase());
        router.push(`/search?${params.toString()}`);
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-3xl mx-auto rounded-2xl p-2"
            style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,207,0,0.2)',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Toggle: Looking for */}
            <div className="flex rounded-xl overflow-hidden mb-3 p-1"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                {(['bride', 'groom'] as const).map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => setLookingFor(opt)}
                        className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize"
                        style={
                            lookingFor === opt
                                ? { background: 'linear-gradient(135deg, #FFCF00, #FFE033)', color: '#1A1208' }
                                : { color: 'rgba(255,255,255,0.5)' }
                        }
                    >
                        Looking for {opt === 'bride' ? '👰 Bride' : '🤵 Groom'}
                    </button>
                ))}
            </div>

            {/* Fields row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                <div className="flex flex-col gap-1 px-2">
                    <label className="text-xs text-white/80 font-semibold">Age</label>
                    <div className="flex items-center gap-1">
                        <select
                            value={ageMin}
                            onChange={e => setAgeMin(e.target.value)}
                            className="flex-1 rounded-lg px-2 py-2 text-sm text-white bg-transparent border"
                            style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)' }}
                        >
                            {ageOptions.map(a => <option key={a} value={a} className="bg-gray-900">{a} yrs</option>)}
                        </select>
                        <span className="text-white/70 text-xs font-medium">to</span>
                        <select
                            value={ageMax}
                            onChange={e => setAgeMax(e.target.value)}
                            className="flex-1 rounded-lg px-2 py-2 text-sm text-white bg-transparent border"
                            style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)' }}
                        >
                            {ageOptions.map(a => <option key={a} value={a} className="bg-gray-900">{a} yrs</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1 px-2">
                    <label className="text-xs text-white/80 font-semibold">Religion</label>
                    <select
                        value={religion}
                        onChange={e => setReligion(e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm text-white border w-full"
                        style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)' }}
                    >
                        {religions.map(r => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
                    </select>
                </div>

                <div className="flex items-end px-2">
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-[#1A1208] text-sm transition-all hover:brightness-110 hover:scale-[1.02]"
                        style={{ background: 'linear-gradient(135deg, #FFCF00, #FFE033)', boxShadow: '0 4px 16px rgba(255,207,0,0.4)' }}
                    >
                        <Search size={15} /> Search Profiles
                    </button>
                </div>
            </div>
        </form>
    );
}

