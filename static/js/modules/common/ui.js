import { apiGroups } from './apiConfig.js';
import { fetchMinMaxDates } from './api/dashboard.js';

const tabContainer = document.getElementById('tab-container');
const contentContainer = document.getElementById('tab-content-container');


function createApiSection(api, id) {
    const section = document.createElement('div');
    section.className = 'api-section mb-6';
    section.id = `api-${id}`;
    
    const methodBadgeClass = `badge-${api.method.toLowerCase()}`;
    
    section.innerHTML = `
        <div class="api-section-header flex justify-between items-center mb-4">
            <h3>${api.title}</h3>
            <span class="badge ${methodBadgeClass}">${api.method}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="input-section">
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                    <div class="font-mono text-sm p-2 bg-gray-100 rounded">
                        <a href="${api.method === 'GET' ? `${api.endpoint}?${new URLSearchParams(api.defaultData)}` : api.endpoint}" target="_blank" class="text-blue-600 hover:underline">${api.endpoint}</a>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Request Data</label>
                    <textarea id="data-${id}" class="w-full p-2 border rounded font-mono text-sm" rows="6" style="min-height: 150px;">${JSON.stringify(api.defaultData, null, 2)}</textarea>
                </div>
                <button onclick="testApi(this, '${api.endpoint}', '${api.method}', '${id}')" 
                        class="btn-primary flex items-center">
                    <span class="loading-spinner hidden"></span>
                    <span>API 호출</span>
                </button>
            </div>
            <div class="output-section">
                <label class="block text-sm font-medium text-gray-700 mb-1">Response</label>
                <div class="code-block">
                    <pre id="response-${id}" class="whitespace-pre-wrap break-words">API 호출 후 결과가 여기에 표시됩니다.</pre>
                </div>
            </div>
        </div>
    `;
    
    return section;
}


export function initializeTabs() {
    tabContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    Object.keys(apiGroups).forEach((groupName, index) => {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = groupName;
        tabButton.dataset.tab = `tab-${index}`;
        tabContainer.appendChild(tabButton);

        const contentPane = document.createElement('div');
        contentPane.id = `tab-${index}`;
        contentPane.className = 'tab-content';
        contentContainer.appendChild(contentPane);

        apiGroups[groupName].forEach((api, apiIndex) => {
            const apiSection = createApiSection(api, `${index}-${apiIndex}`);
            contentPane.appendChild(apiSection);
        });

        tabButton.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(pane => {
                pane.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            contentPane.classList.add('active');
            tabButton.classList.add('active');
        });
    });

    const firstTab = tabContainer.firstChild;
    if (firstTab) {
        firstTab.click();
    }
    
    addAutoTestTab();
}


function addAutoTestTab() {
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.textContent = '🤖 Auto Test';
    tabButton.dataset.tab = 'tab-auto-test';
    tabContainer.appendChild(tabButton);

    const contentPane = document.createElement('div');
    contentPane.id = 'tab-auto-test';
    contentPane.className = 'tab-content';
    contentPane.innerHTML = `
        <div class="api-section">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">🤖 Auto API Test</h3>
                <button id="run-all-tests" class="btn-primary">Run All API Tests</button>
            </div>
            <div id="test-summary" class="mb-4"></div>
            <div id="test-log"></div>
        </div>
    `;
    contentContainer.appendChild(contentPane);

    tabButton.addEventListener('click', () => {
        document.querySelectorAll('.tab-content').forEach(pane => {
            pane.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        contentPane.classList.add('active');
        tabButton.classList.add('active');
    });

    document.getElementById('run-all-tests').addEventListener('click', runAllTests);
}

async function runAllTests() {
    const summaryContainer = document.getElementById('test-summary');
    const logContainer = document.getElementById('test-log');

    summaryContainer.innerHTML = '';
    logContainer.innerHTML = '<p>Running tests...</p>';

    let totalTests = 0;
    let successfulTests = 0;
    let failedTests = 0;

    const logTable = document.createElement('table');
    logTable.className = 'w-full text-sm text-left text-gray-500';
    logTable.innerHTML = `
        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
                <th scope="col" class="px-6 py-3">Endpoint</th>
                <th scope="col" class="px-6 py-3">Method</th>
                <th scope="col" class="px-6 py-3">URL</th>
                <th scope="col" class="px-6 py-3">Status</th>
                <th scope="col" class="px-6 py-3">Response Time</th>
                <th scope="col" class="px-6 py-3">Details</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const logBody = logTable.querySelector('tbody');
    logContainer.innerHTML = '';
    logContainer.appendChild(logTable);

    for (const groupName in apiGroups) {
        for (const api of apiGroups[groupName]) {
            if (api.endpoint.includes('gemini')) {
                continue;
            }

            totalTests++;
            const startTime = performance.now();
            let status = 'Fail';
            let details = '';
            let responseTime = 0;
            let url = api.endpoint;

            try {
                const options = {
                    method: api.method,
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                };

                if (api.method === 'GET') {
                    const params = new URLSearchParams(api.defaultData);
                    url += `?${params.toString()}`;
                } else {
                    options.body = JSON.stringify(api.defaultData);
                }

                const response = await fetch(url, options);
                responseTime = performance.now() - startTime;
                
                if (response.ok) {
                    status = 'Success';
                    successfulTests++;
                } else {
                    failedTests++;
                    const responseBody = await response.text();
                    details = `${response.status} ${response.statusText}: ${responseBody}`;
                }
            } catch (error) {
                failedTests++;
                responseTime = performance.now() - startTime;
                details = error.message;
            }

            const logRow = document.createElement('tr');
            logRow.className = 'bg-white border-b';
            logRow.innerHTML = `
                <td class="px-6 py-4">${api.endpoint}</td>
                <td class="px-6 py-4">${api.method}</td>
                <td class="px-6 py-4"><a href="${url}" target="_blank" class="text-blue-600 hover:underline">Link</a></td>
                <td class="px-6 py-4">${status}</td>
                <td class="px-6 py-4">${responseTime.toFixed(2)}ms</td>
                <td class="px-6 py-4">${status === 'Fail' ? details : ''}</td>
            `;
            logBody.appendChild(logRow);
        }
    }

    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    summaryContainer.innerHTML = `
        <h4 class="text-lg font-bold mb-2">Test Summary</h4>
        <p>Total Tests: ${totalTests}</p>
        <p>Successful: ${successfulTests}</p>
        <p>Failed: ${failedTests}</p>
        <p>Success Rate: ${successRate.toFixed(2)}%</p>
    `;
}


export async function updateDateRangeDisplay(dataType, elementId) {
    const displayElement = document.getElementById(elementId);
    if (!displayElement) {

        return;
    }

    try {
        const dates = await fetchMinMaxDates(dataType);
        if (dates && dates.min_date && dates.max_date) {
            displayElement.textContent = `${dates.min_date} ~ ${dates.max_date}`;
        } else {
            displayElement.textContent = 'N/A';
        }
    } catch (error) {

        displayElement.textContent = 'Error';
    }
}
