const SOUNDS = {
    notification: '/message-notification-sound.mp3',
    callRingtone: '/call-ringtone.mp3',
    callerRingback: '/phone-calling-bep-bep.mp3',
} as const;

let unlocked = false;
let unlockListenersAttached = false;
let notificationAudio: HTMLAudioElement | null = null;
let ringtoneAudio: HTMLAudioElement | null = null;
let ringbackAudio: HTMLAudioElement | null = null;
let ringtonePlaying = false;
let ringbackPlaying = false;

function configureAudio(audio: HTMLAudioElement, loop = false) {
    audio.preload = 'auto';
    audio.loop = loop;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.setAttribute('x5-playsinline', 'true');
}

function getNotificationAudio(): HTMLAudioElement {
    if (!notificationAudio) {
        notificationAudio = new Audio(SOUNDS.notification);
        configureAudio(notificationAudio);
    }
    return notificationAudio;
}

function getRingtoneAudio(): HTMLAudioElement {
    if (!ringtoneAudio) {
        ringtoneAudio = new Audio(SOUNDS.callRingtone);
        configureAudio(ringtoneAudio, true);
    }
    return ringtoneAudio;
}

function getRingbackAudio(): HTMLAudioElement {
    if (!ringbackAudio) {
        ringbackAudio = new Audio(SOUNDS.callerRingback);
        configureAudio(ringbackAudio, true);
    }
    return ringbackAudio;
}

async function warmAudio(audio: HTMLAudioElement): Promise<void> {
    const previousVolume = audio.volume;
    audio.volume = 0.01;
    try {
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
    } catch {
        // Browser may block until a later gesture — retry on actual playback.
    } finally {
        audio.volume = previousVolume;
    }
}

function removeUnlockListeners(unlock: () => void) {
    const events = ['touchstart', 'touchend', 'click', 'keydown'] as const;
    const opts: AddEventListenerOptions = {capture: true};
    events.forEach((event) => document.removeEventListener(event, unlock, opts));
}

/**
 * Unlock audio playback after the first user gesture (required on iOS / mobile browsers).
 * Call once at app root (e.g. CallProvider).
 */
export function initSoundUnlock(): () => void {
    if (typeof window === 'undefined' || unlockListenersAttached) {
        return () => {};
    }
    unlockListenersAttached = true;

    const unlock = () => {
        if (unlocked) return;
        unlocked = true;
        void Promise.all([
            warmAudio(getNotificationAudio()),
            warmAudio(getRingtoneAudio()),
            warmAudio(getRingbackAudio()),
        ]);
        removeUnlockListeners(unlock);
    };

    const events = ['touchstart', 'touchend', 'click', 'keydown'] as const;
    const opts: AddEventListenerOptions = {capture: true, passive: true};
    events.forEach((event) => document.addEventListener(event, unlock, opts));

    return () => removeUnlockListeners(unlock);
}

export function isSoundUnlocked(): boolean {
    return unlocked;
}

/** Play the short notification chime (all in-app notifications). */
export async function playNotificationSound(): Promise<void> {
    if (typeof window === 'undefined') return;

    const audio = getNotificationAudio();
    audio.loop = false;

    const attempt = async () => {
        try {
            audio.pause();
            audio.currentTime = 0;
            await audio.play();
        } catch {
            if (!unlocked) {
                const retry = () => {
                    void attempt();
                };
                document.addEventListener('touchstart', retry, {capture: true, once: true});
                document.addEventListener('click', retry, {capture: true, once: true});
            }
        }
    };

    await attempt();
}

/** Loop the full ringtone — receiver incoming call only. */
export async function startIncomingCallRingtone(): Promise<void> {
    if (typeof window === 'undefined') return;

    const audio = getRingtoneAudio();
    audio.loop = true;

    const attempt = async () => {
        try {
            audio.pause();
            audio.currentTime = 0;
            await audio.play();
            ringtonePlaying = true;
        } catch {
            ringtonePlaying = false;
            if (!unlocked) {
                const retry = () => {
                    void attempt();
                };
                document.addEventListener('touchstart', retry, {capture: true, once: true});
                document.addEventListener('click', retry, {capture: true, once: true});
            }
        }
    };

    await attempt();
}

/** @deprecated Use startIncomingCallRingtone */
export const startCallRingtone = startIncomingCallRingtone;

/** Stop the receiver's looping ringtone. */
export function stopIncomingCallRingtone(): void {
    if (!ringtoneAudio) {
        ringtonePlaying = false;
        return;
    }
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
    ringtonePlaying = false;
}

/** @deprecated Use stopIncomingCallRingtone */
export const stopCallRingtone = stopIncomingCallRingtone;

/** Loop caller ringback MP3 while the receiver's phone is ringing. */
export async function startCallerRingback(): Promise<void> {
    if (typeof window === 'undefined') return;
    stopCallerRingback();

    const audio = getRingbackAudio();
    audio.loop = true;

    const attempt = async () => {
        try {
            audio.pause();
            audio.currentTime = 0;
            await audio.play();
            ringbackPlaying = true;
        } catch {
            ringbackPlaying = false;
            if (!unlocked) {
                const retry = () => {
                    void attempt();
                };
                document.addEventListener('touchstart', retry, {capture: true, once: true});
                document.addEventListener('click', retry, {capture: true, once: true});
            }
        }
    };

    await attempt();
}

/** Stop the caller's ringback. */
export function stopCallerRingback(): void {
    if (!ringbackAudio) {
        ringbackPlaying = false;
        return;
    }
    ringbackAudio.pause();
    ringbackAudio.currentTime = 0;
    ringbackPlaying = false;
}

export function stopAllCallSounds(): void {
    stopIncomingCallRingtone();
    stopCallerRingback();
}

export function isCallRingtonePlaying(): boolean {
    return ringtonePlaying && !ringtoneAudio?.paused;
}

/** Retry ringtone after a tap on the incoming-call UI (mobile unlock fallback). */
export function retryIncomingCallRingtoneIfNeeded(): void {
    if (!ringtonePlaying || ringtoneAudio?.paused) {
        void startIncomingCallRingtone();
    }
}
