/** Prefix user-scoped React Query keys so each account has an isolated cache. */
export function userQueryKey(userId: number | undefined | null, ...key: unknown[]): unknown[] {
    if (!userId) return key;
    return ['user', userId, ...key];
}
