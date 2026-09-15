/**
 * Central SVG icon library for MatriConnect Matrimony.
 * All icons are inline SVG components for zero-dependency, crisp rendering.
 * Usage: <HomeIcon className="w-5 h-5 text-[#3D3220]" />
 */

import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number;
};

function Icon({size = 20, strokeWidth = 1.8, className, children, ...props}: IconProps & { children?: React.ReactNode }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {children}
        </svg>
    );
}

// ── Navigation Icons ─────────────────────────────────────────────────────────

export function HomeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
        </Icon>
    );
}

export function MatchesIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </Icon>
    );
}

export function EngagementRingIcon({ size = 20, strokeWidth = 1.75, className, ...props }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
            <path d="M9 6 12 2.5 15 6 14 8.5 12 10 10 8.5z" fill="#D4AF37" stroke="#D4AF37" />
            <circle cx="12" cy="14.5" r="6.5" />
        </svg>
    );
}

export function SearchIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
        </Icon>
    );
}

export function InterestIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
        </Icon>
    );
}

export function ChatIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </Icon>
    );
}

export function StarIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </Icon>
    );
}

export function StarFilledIcon(props: IconProps) {
    return (
        <Icon {...props} fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </Icon>
    );
}

export function BellIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </Icon>
    );
}

export function UserIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </Icon>
    );
}

export function LogOutIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
        </Icon>
    );
}

// ── Notification Type Icons ───────────────────────────────────────────────────

export function MailIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
        </Icon>
    );
}

export function CelebrationIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M6 3v12"/>
            <path d="M18 9v12"/>
            <path d="M6 15H4.33a1 1 0 00-.95.68l-1.31 4 3.93-1.5A5 5 0 009.5 21h.5"/>
            <path d="M18 21h.5a5 5 0 003.5-1.43l3.43 1.3-1.13-3.37A1 1 0 0023.83 16H22"/>
            <path d="M6 15a5 5 0 009 0"/>
            <path d="M6 3a5 5 0 019 0"/>
        </Icon>
    );
}

export function SparklesIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 3l1.45 4.45L18 9l-4.55 1.55L12 15l-1.45-4.45L6 9l4.55-1.55L12 3z"/>
            <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z"/>
            <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/>
        </Icon>
    );
}

export function ClockIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </Icon>
    );
}

export function EyeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </Icon>
    );
}

export function MessageSquareIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </Icon>
    );
}

export function HeartIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </Icon>
    );
}

export function AlertTriangleIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </Icon>
    );
}

export function CheckCircleIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </Icon>
    );
}

export function XCircleIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </Icon>
    );
}

export function MegaphoneIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 010 7.07"/>
            <path d="M19.07 4.93a10 10 0 010 14.14"/>
        </Icon>
    );
}

// ── Action Icons ─────────────────────────────────────────────────────────────

export function XIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </Icon>
    );
}

export function CheckIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polyline points="20 6 9 17 4 12"/>
        </Icon>
    );
}

export function ArrowLeftIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
        </Icon>
    );
}

export function ArrowRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
        </Icon>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polyline points="9 18 15 12 9 6"/>
        </Icon>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polyline points="15 18 9 12 15 6"/>
        </Icon>
    );
}

// ── Profile & Media Icons ─────────────────────────────────────────────────────

export function CameraIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
        </Icon>
    );
}

export function ImageIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
        </Icon>
    );
}

export function VideoIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </Icon>
    );
}

export function PaperclipIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
        </Icon>
    );
}

export function SendIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </Icon>
    );
}

export function GraduationCapIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </Icon>
    );
}

export function MapPinIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
        </Icon>
    );
}

export function ReligionIcon(props: IconProps) {
    // Star and crescent / generic religion icon
    return (
        <Icon {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </Icon>
    );
}

export function FilterIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
        </Icon>
    );
}

export function PlusIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
        </Icon>
    );
}

// ── Gender Avatar Placeholders ────────────────────────────────────────────────

export function FemaleAvatarIcon(props: IconProps) {
    return (
        <Icon {...props} fill="currentColor" stroke="none">
            <circle cx="12" cy="8" r="4"/>
            <path d="M12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
            <path d="M12 12v3M10 14h4" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </Icon>
    );
}

export function MaleAvatarIcon(props: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={props.size ?? 24}
            height={props.size ?? 24}
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            className={props.className}
            {...(Object.fromEntries(Object.entries(props).filter(([k]) => !['size', 'strokeWidth'].includes(k))))}
        >
            <circle cx="12" cy="8" r="4"/>
            <path d="M12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
        </svg>
    );
}

// ── Status icons (message delivery) ──────────────────────────────────────────

export function SendingIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
        </Icon>
    );
}

export function SentIcon(props: IconProps) {
    return (
        <Icon {...props} strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12"/>
        </Icon>
    );
}

export function DeliveredIcon(props: IconProps) {
    return (
        <Icon {...props} strokeWidth={2.5}>
            <polyline points="17 6 7 16 3 12"/>
            <polyline points="22 6 12 16"/>
        </Icon>
    );
}

export function ReadIcon(props: IconProps) {
    return (
        <Icon {...props} strokeWidth={2.5}>
            <polyline points="17 6 7 16 3 12"/>
            <polyline points="22 6 12 16"/>
        </Icon>
    );
}

// ── Online Indicator ──────────────────────────────────────────────────────────

export function OnlineCircleIcon({ className, size = 8 }: { className?: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 8 8" className={className}>
            <circle cx="4" cy="4" r="4" fill="currentColor"/>
        </svg>
    );
}

// ── Crown / Subscription ──────────────────────────────────────────────────────

export function CrownIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 17l3-9 6 5 6-5 3 9H3z"/>
            <line x1="3" y1="21" x2="21" y2="21"/>
        </Icon>
    );
}

// ── Inbox / Outbox ────────────────────────────────────────────────────────────

export function InboxIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
        </Icon>
    );
}

export function OutboxIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
            <path d="M12 7V3M9 6l3-3 3 3" strokeWidth={2}/>
        </Icon>
    );
}

// ── Profile sections ──────────────────────────────────────────────────────────

export function ProfileBasicIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </Icon>
    );
}

export function CareerIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        </Icon>
    );
}

export function FamilyIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
        </Icon>
    );
}

export function LifestyleIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
        </Icon>
    );
}

export function PreferencesIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
        </Icon>
    );
}

export function HoroscopeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </Icon>
    );
}

// ── Wave / Greeting ───────────────────────────────────────────────────────────

export function WaveIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M18.5 17.5c-.83.83-2 1.25-3.25 1.25-1.25 0-2.42-.42-3.25-1.25L9 14.5c-.83-.83-1.25-2-1.25-3.25 0-1.25.42-2.42 1.25-3.25"/>
            <path d="M14 4l2 2-7 7-2-2 7-7z"/>
            <path d="M8 10L6 8 4 10l2 2 2-2z"/>
        </Icon>
    );
}

// ── Info / Help ───────────────────────────────────────────────────────────────

export function InfoIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </Icon>
    );
}

export function ThumbsUpIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
        </Icon>
    );
}

export function ExternalLinkIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
        </Icon>
    );
}

