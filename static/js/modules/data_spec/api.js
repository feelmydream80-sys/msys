




export async function checkName(name, id) {
    const url = `/api/data-spec/check-name?data_name=${encodeURIComponent(name)}&spec_id=${id || ''}`;
    const response = await fetch(url);
    return response.json();
}


export async function scrapeSpec(url) {
    const response = await fetch('/api/scrape-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Scraping failed');
    }
    return response.json();
}


export async function getSpecs() {
    const response = await fetch('/api/data-spec');
    return response.json();
}


export async function getSpecById(id) {
    const response = await fetch(`/api/data-spec/${id}`);
    return response.json();
}


export async function saveSpec(id, specData) {
    const url = id ? `/api/data-spec/${id}` : '/api/data-spec';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || 'Save failed');
        } catch (e) {
            throw new Error(errorText || 'Save failed');
        }
    }
    return response.json();
}


export async function deleteSpec(id, password) {
    const payload = password !== null ? { password: password } : {};
    const response = await fetch(`/api/data-spec/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
    }
    return response.json();
}
