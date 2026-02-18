/* ═══════════════════════════════════════════
   Supabase Client — Full REST API
   GET / POST / PATCH / DELETE + Storage
   ═══════════════════════════════════════════ */

const SUPABASE_URL = 'https://jusckwmbqpcmnnqfafog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1c2Nrd21icXBjbW5ucWZhZm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTQxNzAsImV4cCI6MjA4Njg5MDE3MH0.abfVBDBDppkmGsqozqgmLnSuFNj-pnkO0s8I4UaetWM';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

/* ──── Shared Headers ──── */
function baseHeaders(prefer) {
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(prefer ? { 'Prefer': prefer } : {})
    };
}

/* ──── GET ──── */
export async function supabaseGet(table, params = {}) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    Object.entries(params).forEach(([key, value]) => {
        if (key !== '_prefer') url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
        headers: baseHeaders(params._prefer || 'return=representation')
    });

    if (!response.ok) {
        throw new Error(`Supabase GET error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/* ──── GET with Count ──── */
export async function supabaseGetWithCount(table, params = {}) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    Object.entries(params).forEach(([key, value]) => {
        if (key !== '_prefer') url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
        headers: baseHeaders('count=exact')
    });

    if (!response.ok) {
        throw new Error(`Supabase GET error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const count = parseInt(response.headers.get('content-range')?.split('/')[1] || '0', 10);
    return { data, count };
}

/* ──── POST (Insert) ──── */
export async function supabaseInsert(table, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: baseHeaders('return=representation'),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Supabase INSERT error: ${response.status} — ${err}`);
    }
    return response.json();
}

/* ──── PATCH (Update) ──── */
export async function supabaseUpdate(table, params = {}, body = {}) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
        method: 'PATCH',
        headers: baseHeaders('return=representation'),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Supabase UPDATE error: ${response.status} — ${err}`);
    }
    return response.json();
}

/* ──── DELETE ──── */
export async function supabaseDelete(table, params = {}) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: baseHeaders('return=representation')
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Supabase DELETE error: ${response.status} — ${err}`);
    }
    return response.json();
}

/* ──── Storage: Upload File ──── */
export async function supabaseUpload(bucket, path, file) {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': file.type,
            'x-upsert': 'true'
        },
        body: file
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Storage upload error: ${response.status} — ${err}`);
    }
    return response.json();
}

/* ──── Storage: Delete File ──── */
export async function supabaseStorageDelete(bucket, paths) {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefixes: paths })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Storage delete error: ${response.status} — ${err}`);
    }
    return response.json();
}

/* ──── Storage: Get Public URL ──── */
export function supabasePublicUrl(bucket, path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
