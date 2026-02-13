"use client";

export const EVENTS = {
    SESSION_STARTED: 'session_started',
    PAGE_VIEW: 'page_view',
    STEP_ENTERED: 'step_entered',
    STEP_COMPLETED: 'step_completed',
    PHOTO_UPLOADED: 'photo_uploaded',
    PRODUCT_SELECTED: 'product_selected',
    SIMULATION_GENERATED: 'simulation_generated',
    SIMULATION_FAILED: 'simulation_failed',
    QUOTE_VIEWED: 'quote_viewed',
    CTA_CLICKED: 'cta_clicked',
    LEAD_CAPTURED: 'lead_captured',
} as const;

export function getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    let id = sessionStorage.getItem('paver_session_id');
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('paver_session_id', id);
    }
    return id;
}

export function trackEvent(
    eventType: string,
    data?: Record<string, any>,
    step?: string
): void {
    try {
        const body = {
            session_id: getSessionId(),
            event_type: eventType,
            event_data: data || {},
            step: step || null,
        };
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => {}); // fire-and-forget
    } catch {
        // silent fail — analytics should never break the app
    }
}
