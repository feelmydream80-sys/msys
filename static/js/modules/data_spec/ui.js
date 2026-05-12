




export const elements = {};


let currentSpecHasPassword = false;


export function initializeDOMElements() {
    elements.specListBody = document.getElementById('spec-list-body');
    elements.addNewBtn = document.getElementById('add-new-btn');
    elements.modal = document.getElementById('spec-modal');
    elements.modalTitle = document.getElementById('modal-title');
    elements.closeModalBtn = document.getElementById('close-modal-btn');
    elements.closeModalXBtn = document.getElementById('close-modal-x-btn');
    elements.saveBtn = document.getElementById('save-btn');
    elements.deleteBtn = document.getElementById('delete-btn');
    elements.saveStatus = document.getElementById('save-status');
    elements.passwordConfirmModal = document.getElementById('password-confirm-modal');
    elements.passwordConfirmInput = document.getElementById('password-confirm-input');
    elements.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    elements.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    elements.passwordErrorMsg = document.getElementById('password-error-msg');
    elements.savePasswordConfirmModal = document.getElementById('save-password-confirm-modal');
    elements.savePasswordInput = document.getElementById('save-password-input');
    elements.confirmSaveBtn = document.getElementById('confirm-save-btn');
    elements.cancelSaveBtn = document.getElementById('cancel-save-btn');
    elements.savePasswordErrorMsg = document.getElementById('save-password-error-msg');
    elements.specIdInput = document.getElementById('spec-id');
    elements.dataNameInput = document.getElementById('data_name');
    elements.providerInput = document.getElementById('provider');
    elements.apiUrlInput = document.getElementById('api_url');
    elements.refDocUrlInput = document.getElementById('reference_doc_url');
    elements.keywordsInput = document.getElementById('keywords');
    elements.descriptionInput = document.getElementById('description');
    elements.passwordInput = document.getElementById('password');
    elements.requestParamsContainer = document.getElementById('request-params-container');
    elements.responseParamsContainer = document.getElementById('response-params-container');
    elements.scrapeUrlInput = document.getElementById('scrape-url-input');
    elements.scrapeBtn = document.getElementById('scrape-btn');
    elements.scrapeStatus = document.getElementById('scrape-status');
    elements.analyzeBtn = document.getElementById('analyze-btn');
    elements.pasteContentInput = document.getElementById('paste-content-input');
    elements.charCounter = document.getElementById('charCounter');
}


export function renderSpecList(specs, viewHandler) {
    elements.specListBody.innerHTML = '';
    if (!specs || specs.length === 0) {
        elements.specListBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">데이터가 없습니다.</td></tr>';
        return;
    }
    specs.forEach(spec => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-100 cursor-pointer';
        row.dataset.id = spec.id;
        
        const docUrl = spec.reference_doc_url;
        const linkHtml = docUrl 
            ? `<a href="${docUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline" onclick="(e) => e.stopPropagation()">🔗 Link</a>`
            : '';

        row.innerHTML = `
            <td class="py-3 px-4">${spec.id}</td>
            <td class="py-3 px-4">${spec.data_name}</td>
            <td class="py-3 px-4">${spec.provider}</td>
            <td class="py-3 px-4">${spec.keywords}</td>
            <td class="py-3 px-4">${new Date(spec.created_at).toLocaleDateString()}</td>
            <td class="py-3 px-4">${linkHtml}</td>
        `;
        row.addEventListener('click', () => viewHandler(spec.id));
        elements.specListBody.appendChild(row);
    });
}


export function renderParamsTable(params, container) {
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'min-w-full bg-white border';
    table.innerHTML = `
        <thead class="bg-gray-100">
            <tr>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-600">국문명</th>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-600">영문명</th>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-600">필수</th>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-600">설명</th>
            </tr>
        </thead>
        <tbody>
            ${(params && params.length > 0) ? params.map(p => `
                <tr class="border-b">
                    <td class="py-2 px-3 text-sm">${p.name_ko || ''}</td>
                    <td class="py-2 px-3 text-sm">${p.name_en || ''}</td>
                    <td class="py-2 px-3 text-sm">${p.is_required ? 'Y' : 'N'}</td>
                    <td class="py-2 px-3 text-sm">${p.description || ''}</td>
                </tr>
            `).join('') : '<tr><td colspan="4" class="text-center py-4 text-gray-500">파라미터 정보가 없습니다.</td></tr>'}
        </tbody>
    `;
    container.appendChild(table);
}



export const openModal = () => elements.modal.classList.remove('hidden');
export const closeModal = () => elements.modal.classList.add('hidden');

export const openSavePasswordModal = () => elements.savePasswordConfirmModal.classList.remove('hidden');
export const closeSavePasswordModal = () => elements.savePasswordConfirmModal.classList.add('hidden');

export function openDeletePasswordModal() {
    const modal = elements.passwordConfirmModal;
    modal.classList.remove('hidden');
    modal.style.zIndex = '9999';
}
export const closeDeletePasswordModal = () => elements.passwordConfirmModal.classList.add('hidden');


export function resetForm() {
    elements.specIdInput.value = '';
    elements.dataNameInput.value = '';
    elements.providerInput.value = '';
    elements.apiUrlInput.value = '';
    elements.refDocUrlInput.value = '';
    elements.keywordsInput.value = '';
    elements.descriptionInput.value = '';
    if (elements.passwordInput) {
        elements.passwordInput.value = '';
        elements.passwordInput.placeholder = '4자리 이상 비밀번호';
    }
    elements.requestParamsContainer.innerHTML = '<p class="text-gray-500">파라미터 정보가 없습니다.</p>';
    elements.responseParamsContainer.innerHTML = '<p class="text-gray-500">파라미터 정보가 없습니다.</p>';
    elements.deleteBtn.classList.add('hidden');
    currentSpecHasPassword = false;
    
    document.getElementById('spec-form').style.display = 'block';
    document.getElementById('form-sections').style.display = 'block';
    
    document.getElementById('data-name-error').classList.add('hidden');
    elements.saveBtn.disabled = false;
}


export function populateForm(spec, params = [], scrapedData = null) {
    resetForm();
    let requestParams, responseParams;
    currentSpecHasPassword = !!spec.password;

    if (elements.passwordInput) {
        if (spec.id && spec.password) {
            elements.passwordInput.placeholder = '비밀번호가 설정되어 있습니다. 변경하려면 새 비밀번호를 입력하세요.';
        }
    }

    if (scrapedData) {
        elements.modalTitle.textContent = '새 명세서 등록 (URL)';
        elements.dataNameInput.value = scrapedData.data_name || '';
        elements.descriptionInput.value = scrapedData.description || '';
        
        const detailsMap = new Map(scrapedData.details.map(d => [d.key, d.value]));
        elements.providerInput.value = detailsMap.get('제공기관') || '';
        elements.keywordsInput.value = detailsMap.get('키워드') || '';
        elements.apiUrlInput.value = '';
        
        if (scrapedData.reference_doc && scrapedData.reference_doc.onclick) {
            const match = scrapedData.reference_doc.onclick.match(/fileDown\('([^']*)'/);
            if (match && match[1]) {
                elements.refDocUrlInput.value = `https://www.data.go.kr/download/${match[1]}`;
            }
        } else {
             elements.refDocUrlInput.value = elements.scrapeUrlInput.value;
        }

        const requestTable = scrapedData.tables.find(t => t.name.includes('요청변수'));
        const responseTable = scrapedData.tables.find(t => t.name.includes('출력결과'));

        requestParams = requestTable ? requestTable.rows.map(row => ({ name_ko: row[0] || '', name_en: row[1] || '', description: row[2] || '', is_required: (row[3] || 'N') === 'Y' })) : [];
        responseParams = responseTable ? responseTable.rows.map(row => ({ name_ko: row[0] || '', name_en: row[1] || '', description: row[2] || '', is_required: (row[3] || 'N') === 'Y' })) : [];

    } else {
        elements.modalTitle.textContent = '명세 상세 정보';
        elements.specIdInput.value = spec.id || '';
        elements.dataNameInput.value = spec.data_name || '';
        elements.providerInput.value = spec.provider || '';
        elements.apiUrlInput.value = spec.api_url || '';
        elements.refDocUrlInput.value = spec.reference_doc_url || '';
        elements.keywordsInput.value = spec.keywords || '';
        elements.descriptionInput.value = spec.description || '';
        
        requestParams = (spec.params || params).filter(p => p.param_type === 'request');
        responseParams = (spec.params || params).filter(p => p.param_type === 'response');
    }
    
    renderParamsTable(requestParams, elements.requestParamsContainer);
    renderParamsTable(responseParams, elements.responseParamsContainer);

    const urlContainer = elements.refDocUrlInput.parentElement;
    let goBtn = urlContainer.querySelector('.go-btn');
    if (!goBtn) {
        goBtn = document.createElement('button');
        goBtn.textContent = '바로가기';
        goBtn.type = 'button';
        goBtn.className = 'go-btn ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300';
        goBtn.addEventListener('click', () => {
            const url = elements.refDocUrlInput.value;
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
        });
        urlContainer.appendChild(goBtn);
    }
    
    if (spec.id) {
        elements.deleteBtn.classList.remove('hidden');
    } else {
        elements.deleteBtn.classList.add('hidden');
    }
}


export function hasPassword() {
    return currentSpecHasPassword;
}
