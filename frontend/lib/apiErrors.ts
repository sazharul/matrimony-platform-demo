type ApiErrorPayload = {
    message?: string;
    errors?: Record<string, string | string[]>;
};

function normalizeFieldError(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
}

/** Extract the first validation error for a specific field. */
export function getFieldError(
    errors: Record<string, string | string[]> | undefined,
    field: string,
): string | undefined {
    return normalizeFieldError(errors?.[field]);
}

/** Extract a user-facing message from a Laravel-style API error payload. */
export function getApiErrorMessage(
    payload: ApiErrorPayload | undefined,
    fallback: string,
    preferredField?: string,
): string {
    if (!payload) return fallback;

    if (preferredField) {
        const fieldMsg = getFieldError(payload.errors, preferredField);
        if (fieldMsg) return fieldMsg;
    }

    if (payload.errors) {
        for (const value of Object.values(payload.errors)) {
            const msg = normalizeFieldError(value);
            if (msg) return msg;
        }
    }

    return payload.message ?? fallback;
}
