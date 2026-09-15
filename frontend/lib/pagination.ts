export interface NormalizedPage<T> {
    items: T[];
    page: number;
    lastPage: number;
    total: number;
    hasMore: boolean;
}

interface PageMeta {
    current_page?: number;
    last_page?: number;
    total?: number;
}

interface FlatPaginated<T> extends PageMeta {
    data?: T[];
}

interface MetaPaginated<T> {
    data?: T[];
    meta?: PageMeta;
}

interface PaginationKeyPaginated<T> {
    data?: T[];
    pagination?: PageMeta;
}

export function normalizeFlatPage<T>(payload: FlatPaginated<T>, page = 1): NormalizedPage<T> {
    const items = payload.data ?? [];
    const currentPage = payload.current_page ?? page;
    const lastPage = payload.last_page ?? 1;
    const total = payload.total ?? items.length;

    return {
        items,
        page: currentPage,
        lastPage,
        total,
        hasMore: currentPage < lastPage,
    };
}

export function normalizeMetaPage<T>(payload: MetaPaginated<T>, page = 1): NormalizedPage<T> {
    const items = payload.data ?? [];
    const meta = payload.meta ?? {};
    const currentPage = meta.current_page ?? page;
    const lastPage = meta.last_page ?? 1;
    const total = meta.total ?? items.length;

    return {
        items,
        page: currentPage,
        lastPage,
        total,
        hasMore: currentPage < lastPage,
    };
}

export function normalizePaginationKeyPage<T>(payload: PaginationKeyPaginated<T>, page = 1): NormalizedPage<T> {
    const items = payload.data ?? [];
    const pagination = payload.pagination ?? {};
    const currentPage = pagination.current_page ?? page;
    const lastPage = pagination.last_page ?? 1;
    const total = pagination.total ?? items.length;

    return {
        items,
        page: currentPage,
        lastPage,
        total,
        hasMore: currentPage < lastPage,
    };
}
