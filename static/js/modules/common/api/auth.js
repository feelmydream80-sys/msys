


import { sendRequest } from './client.js';


export async function getAuthStatus() {
    return await sendRequest('/api/auth/status');
}