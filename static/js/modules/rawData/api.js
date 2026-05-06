


export async function fetchJobIds() {
    const response = await fetch('/api/analytics/job_ids');
    if (!response.ok) {

        return [];
    }
    return await response.json();
}


export async function fetchAllData(startDate, endDate, jobIds = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));

    const url = `/api/raw_data?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {

        return [];
    }
    return await response.json();
}


export async function fetchErrorCodeMap() {
    const response = await fetch('/api/analytics/error_code_map');
    if (!response.ok) {

        return {};
    }
    return await response.json();
}


export async function fetchMinMaxDates() {
    const response = await fetch('/api/min-max-dates');
    if (!response.ok) {

        return { min_date: null, max_date: null };
    }
    return await response.json();
}
