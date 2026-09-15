import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface RevalidateBody {
    tags?: string[];
    paths?: string[];
}

export async function POST(request: NextRequest) {
    const secret =
        request.headers.get('x-revalidate-secret') ??
        request.nextUrl.searchParams.get('secret');

    if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    let body: RevalidateBody = {};
    try {
        body = (await request.json()) as RevalidateBody;
    } catch {
        // Empty body is valid when only path revalidation is needed via query params.
    }

    const tags = body.tags ?? [];
    const paths = body.paths ?? [];

    for (const tag of tags) {
        revalidateTag(tag, 'max');
    }

    for (const path of paths) {
        revalidatePath(path, 'layout');
    }

    return NextResponse.json({ revalidated: true, tags, paths });
}
