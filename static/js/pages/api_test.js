
import { setDefaultDates } from '../modules/common/dateUtils.js';
import { initializeTabs } from '../modules/common/ui.js';


export function init() {

    setDefaultDates();
    

    initializeTabs();
}


window.testApi = async function(button, endpoint, method, id) {
    const dataElement = document.getElementById(`data-${id}`);
    const responseArea = document.getElementById(`response-${id}`);
    const spinner = button.querySelector('.loading-spinner');
    const buttonText = button.querySelector('span:not(.loading-spinner)');
    let url = endpoint;

    try {

        button.disabled = true;
        spinner.classList.remove('hidden');
        buttonText.textContent = '처리 중...';
        responseArea.textContent = '요청을 처리 중입니다...';

        const minDisplayTime = new Promise(resolve => setTimeout(resolve, 200));
        const apiCall = (async () => {
            let requestData = {};
            try {
                requestData = JSON.parse(dataElement.value);
            } catch (e) {
                throw new Error('유효한 JSON 형식이 아닙니다.');
            }

            const queryParams = new URLSearchParams();
            Object.keys(requestData).forEach(key => {
                const placeholder = `{${key}}`;
                if (url.includes(placeholder)) {
                    url = url.replace(placeholder, encodeURIComponent(requestData[key]));
                    delete requestData[key];
                } else if (method === 'GET') {
                    if (requestData[key] !== null && requestData[key] !== '') {
                        queryParams.append(key, requestData[key]);
                    }
                }
            });

            if (queryParams.toString() && method === 'GET') {
                url += (url.includes('?') ? '&' : '?') + queryParams.toString();
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: controller.signal
            };

            if (method !== 'GET' && Object.keys(requestData).length > 0) {
                options.body = JSON.stringify(requestData);
            }

            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            const responseData = await response.json();

            const urlDisplay = `Called URL: ${url}\n\n`;
            responseArea.textContent = urlDisplay + JSON.stringify(responseData, null, 2);
            responseArea.className = response.ok ? 'text-green-100' : 'text-red-100';
        })();

        await Promise.all([apiCall, minDisplayTime]);

    } catch (error) {

        if (error.name === 'AbortError') {
            responseArea.textContent = `오류 발생: 요청 시간이 15초를 초과했습니다.`;
        } else {
            const urlDisplay = `Called URL: ${url}\n\n`;
            responseArea.textContent = urlDisplay + `오류 발생: ${error.message}`;
        }
        responseArea.className = 'text-red-100';
    } finally {

        button.disabled = false;
        spinner.classList.add('hidden');
        buttonText.textContent = 'API 호출';
    }
};
