import { API_ENDPOINTS } from './constants.js';


export async function callAPI(endpoint, method = 'GET', data = null) {
    try {
        const url = `/api/${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        return result;
    } catch (error) {

        throw error;
    }
}


export async function getGroups() {
    return callAPI(API_ENDPOINTS.GROUPS);
}


export async function createItem(data) {
    return callAPI(API_ENDPOINTS.CREATE, 'POST', data);
}


export async function updateGroup(cd, data) {
    return callAPI(`${API_ENDPOINTS.GROUP_UPDATE}/${cd}`, 'PUT', data);
}


export async function deleteGroup(cd) {
    return callAPI(`${API_ENDPOINTS.GROUP_UPDATE}/${cd}`, 'DELETE');
}


export async function updateDetail(cd, data) {
    return callAPI(`${API_ENDPOINTS.DETAIL_UPDATE}/${cd}`, 'PUT', data);
}