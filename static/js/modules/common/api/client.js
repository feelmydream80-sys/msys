
import { showToast as showMessage } from '../../../utils/toast.js';

let globalDataFlowStatus = {};

export function setDataFlowStatus(statusObject) {
    globalDataFlowStatus = statusObject;
}

export function updateApiStatus(apiName, field, value) {
    if (!globalDataFlowStatus) {

        return;
    }
    if (!globalDataFlowStatus[apiName]) {
        globalDataFlowStatus[apiName] = {
            apiCallAttempted: false,
            apiCallSuccess: false,
            apiResponseCount: 0,
            dataProcessedCount: 0,
            chartRendered: false,
            error: null
        };
    }
    globalDataFlowStatus[apiName][field] = value;
    if (field === "error" && value !== null) {
        globalDataFlowStatus.overallStatus = "error";
    }
}


export async function sendRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {

            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {


        showMessage(`데이터를 가져오는 데 실패했습니다: ${error.message}`, 'error');
        throw error;
    }
}
