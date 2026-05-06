



import * as api from './api.js';
import * as ui from './ui.js';
import { initUrlMapper } from './urlMapper.js';
import { initCollapsibleFeatures } from '../ui_components/collapsible.js';
import { initPagination, updatePaginationData } from '../ui_components/pagination.js';
import { showToast } from '../../utils/toast.js';
import { downloadExcelTemplate } from '../../utils/excelDownload.js';

let allSpecs = [];


async function loadSpecs() {
    try {
        allSpecs = await api.getSpecs();
        initPagination({
            fullData: allSpecs,
            pageSize: 10,
            renderTableCallback: (pageData) => ui.renderSpecList(pageData, handleViewSpec),
            paginationId: 'specPagination',
            pageSizeId: 'specPageSize',
            searchId: 'specSearch',
            totalCountId: 'spec-total-count',
        });
    } catch (error) {

        showToast('명세서 목록을 불러오는 데 실패했습니다.', 'error');
    }
}


function handleAddNew() {
    ui.resetForm();
    ui.elements.modalTitle.textContent = '새 명세서 등록 (수동)';
    ui.openModal();
}


async function handleViewSpec(id) {
    try {
        const spec = await api.getSpecById(id);
        ui.populateForm(spec);
        ui.openModal();
    } catch (error) {

        showToast('상세 정보를 불러오는 데 실패했습니다.', 'error');
    }
}


async function handleScrape() {
    const url = ui.elements.scrapeUrlInput.value.trim();
    if (!url) {
        showToast('URL을 입력해주세요.', 'warning');
        return;
    }

    ui.elements.scrapeBtn.disabled = true;
    ui.elements.scrapeStatus.textContent = '가져오는 중...';
    ui.elements.scrapeStatus.className = 'text-gray-500 text-sm';

    try {
        const data = await api.scrapeSpec(url);
        ui.populateForm({}, [], data);
        ui.openModal();
        ui.elements.scrapeStatus.textContent = '가져오기 성공! 팝업에서 내용을 확인하고 저장하세요.';
        ui.elements.scrapeStatus.className = 'text-green-500 text-sm';
    } catch (error) {

        ui.elements.scrapeStatus.textContent = `가져오기 실패: ${error.message}`;
        ui.elements.scrapeStatus.className = 'text-red-500 text-sm';
    } finally {
        ui.elements.scrapeBtn.disabled = false;
    }
}


async function handleSave() {
    const getParamsFromTable = (container, paramType) => {
        return Array.from(container.querySelectorAll('tbody tr')).map(row => {
            const cells = row.querySelectorAll('td');
            return cells.length >= 4 ? {
                param_type: paramType,
                name_ko: cells[0].textContent,
                name_en: cells[1].textContent,
                is_required: cells[2].textContent === 'Y',
                description: cells[3].textContent
            } : null;
        }).filter(p => p);
    };

    const specData = {
        data_name: ui.elements.dataNameInput.value,
        provider: ui.elements.providerInput.value,
        api_url: ui.elements.apiUrlInput.value,
        reference_doc_url: ui.elements.refDocUrlInput.value,
        keywords: ui.elements.keywordsInput.value,
        description: ui.elements.descriptionInput.value,
        password: ui.elements.passwordInput.value,
    };

    const requestParams = getParamsFromTable(ui.elements.requestParamsContainer, 'request');
    const responseParams = getParamsFromTable(ui.elements.responseParamsContainer, 'response');

    const payload = { spec: specData, params: [...requestParams, ...responseParams] };

    if (!specData.data_name) {
        ui.elements.saveStatus.textContent = '데이터 명칭은 필수입니다.';
        ui.elements.saveStatus.className = 'text-red-500 text-sm';
        return;
    }
    
    const id = ui.elements.specIdInput.value;
    if (!id && (!specData.password || specData.password.length < 4)) {
        ui.elements.saveStatus.textContent = '새 명세서에는 4자리 이상의 비밀번호가 필수입니다.';
        ui.elements.saveStatus.className = 'text-red-500 text-sm';
        return;
    }

    ui.elements.saveStatus.textContent = '저장 중...';
    ui.elements.saveStatus.className = 'text-gray-500 text-sm';

    try {
        const result = await api.saveSpec(ui.elements.specIdInput.value, payload);
        if (!ui.elements.specIdInput.value && result.spec_id) {
            ui.elements.specIdInput.value = result.spec_id;
            ui.elements.deleteBtn.classList.remove('hidden');
            ui.elements.modalTitle.textContent = '명세 상세 정보';
        }
        ui.elements.saveStatus.textContent = '저장됨';
        ui.elements.saveStatus.className = 'text-green-500 text-sm';
        showToast('성공적으로 저장되었습니다.', 'success');
        loadSpecs();
        ui.closeModal();
    } catch (error) {

        ui.elements.saveStatus.textContent = `저장 실패: ${error.message}`;
        ui.elements.saveStatus.className = 'text-red-500 text-sm';
    }
}

async function handleSaveWithCheck() {
    const name = ui.elements.dataNameInput.value.trim();
    const id = ui.elements.specIdInput.value;
    const nameErrorMsg = document.getElementById('data-name-error');

    if (!name) {
        nameErrorMsg.textContent = '데이터 명칭은 필수 항목입니다.';
        nameErrorMsg.classList.remove('hidden');
        return;
    }

    try {
        const response = await api.checkName(name, id);
        if (response.exists) {
            nameErrorMsg.textContent = '이미 사용중인 데이터 명칭입니다.';
            nameErrorMsg.classList.remove('hidden');
            return;
        }
        nameErrorMsg.classList.add('hidden');
        await handleSave();
    } catch (error) {

        nameErrorMsg.textContent = '이름 확인 또는 저장 중 오류가 발생했습니다.';
        nameErrorMsg.classList.remove('hidden');
    }
}


async function handleSaveWithPasswordCheck() {
    const password = ui.elements.savePasswordInput.value;

    if (!password || password.length < 4) {
        ui.elements.savePasswordErrorMsg.textContent = '4자리 이상의 비밀번호를 입력해주세요.';
        ui.elements.savePasswordErrorMsg.classList.remove('hidden');
        return;
    }

    ui.elements.confirmSaveBtn.disabled = true;
    ui.elements.savePasswordErrorMsg.classList.add('hidden');

    try {

        ui.elements.passwordInput.value = password;
        await handleSave();
        ui.closeSavePasswordModal();
    } catch (error) {

        ui.elements.savePasswordErrorMsg.textContent = `저장 실패: ${error.message}`;
        ui.elements.savePasswordErrorMsg.classList.remove('hidden');
    } finally {
        ui.elements.confirmSaveBtn.disabled = false;
    }
}


async function handleDelete() {
    const id = ui.elements.specIdInput.value;
    if (!id) return;

    const password = ui.elements.passwordInput.value;


    if (password) {
        try {
            ui.elements.deleteBtn.disabled = true;
            await api.deleteSpec(id, password);
            showToast('성공적으로 삭제되었습니다.', 'success');
            ui.closeModal();
            loadSpecs();
        } catch (error) {

            showToast(`삭제 실패: ${error.message}. 비밀번호를 다시 확인해주세요.`, 'error');
            ui.openDeletePasswordModal();
            ui.elements.passwordConfirmInput.value = '';
            ui.elements.passwordErrorMsg.classList.add('hidden');
            setTimeout(() => ui.elements.passwordConfirmInput.focus(), 50);
        } finally {
            ui.elements.deleteBtn.disabled = false;
        }
    } else if (ui.hasPassword()) {

        ui.openDeletePasswordModal();
        ui.elements.passwordConfirmInput.value = '';
        ui.elements.passwordErrorMsg.classList.add('hidden');
        setTimeout(() => ui.elements.passwordConfirmInput.focus(), 50);
    } else {

        if (!confirm(`정말로 ID ${id} 명세서를 삭제하시겠습니까? (비밀번호 없음)`)) return;
        
        try {
            ui.elements.deleteBtn.disabled = true;
            await api.deleteSpec(id, null); 
            showToast('성공적으로 삭제되었습니다.', 'success');
            ui.closeModal();
            loadSpecs();
        } catch (error) {

            showToast(`삭제에 실패했습니다: ${error.message}`, 'error');
        } finally {
            ui.elements.deleteBtn.disabled = false;
        }
    }
}


async function handleConfirmDelete() {
    const id = ui.elements.specIdInput.value;
    const password = ui.elements.passwordConfirmInput.value;

    if (!password) {
        ui.elements.passwordErrorMsg.textContent = '비밀번호를 입력해주세요.';
        ui.elements.passwordErrorMsg.classList.remove('hidden');
        return;
    }

    ui.elements.confirmDeleteBtn.disabled = true;
    ui.elements.passwordErrorMsg.classList.add('hidden');

    try {
        await api.deleteSpec(id, password);
        showToast('성공적으로 삭제되었습니다.', 'success');
        ui.closeDeletePasswordModal();
        ui.closeModal();
        loadSpecs();
    } catch (error) {

        ui.elements.passwordErrorMsg.textContent = `삭제 실패: ${error.message}`;
        ui.elements.passwordErrorMsg.classList.remove('hidden');
    } finally {
        ui.elements.confirmDeleteBtn.disabled = false;
    }
}


function handleSearch() {
    const searchTerm = document.getElementById('specSearch').value.toLowerCase();
    
    const filteredSpecs = allSpecs.filter(spec => {
        const dataName = spec.data_name ? spec.data_name.toLowerCase() : '';
        const provider = spec.provider ? spec.provider.toLowerCase() : '';
        const keywords = spec.keywords ? spec.keywords.toLowerCase() : '';
        
        return dataName.includes(searchTerm) ||
               provider.includes(searchTerm) ||
               keywords.includes(searchTerm);
    });

    updatePaginationData('specPagination', filteredSpecs);
}


function initializeEventListeners() {
    ui.elements.addNewBtn.addEventListener('click', handleAddNew);
    ui.elements.closeModalBtn.addEventListener('click', ui.closeModal);
    ui.elements.closeModalXBtn.addEventListener('click', ui.closeModal);
    ui.elements.saveBtn.addEventListener('click', handleSaveWithCheck);
    ui.elements.deleteBtn.addEventListener('click', handleDelete);


    ui.elements.modal.addEventListener('click', (e) => {
        if (e.target === ui.elements.modal) {
            ui.closeModal();
        }
    });

    document.getElementById('specSearch').addEventListener('input', handleSearch);


    document.getElementById('fill-from-file-btn').addEventListener('click', handleFillFromFile);
    document.getElementById('fill-from-text-btn').addEventListener('click', handleFillFromText);


    ui.elements.cancelDeleteBtn.addEventListener('click', ui.closeDeletePasswordModal);
    ui.elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    ui.elements.passwordConfirmInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleConfirmDelete();
    });


    ui.elements.cancelSaveBtn.addEventListener('click', ui.closeSavePasswordModal);
    ui.elements.confirmSaveBtn.addEventListener('click', handleSaveWithPasswordCheck);
    ui.elements.savePasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveWithPasswordCheck();
    });


    ui.elements.savePasswordConfirmModal.addEventListener('click', (e) => {
        if (e.target === ui.elements.savePasswordConfirmModal) {
            ui.closeSavePasswordModal();
        }
    });

    ui.elements.passwordConfirmModal.addEventListener('click', (e) => {
        if (e.target === ui.elements.passwordConfirmModal) {
            ui.closeDeletePasswordModal();
        }
    });


    const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
    if (downloadExcelTemplateBtn) {
        downloadExcelTemplateBtn.addEventListener('click', downloadExcelTemplate);
    }
}


function handleFillFromFile() {
    const fileInput = document.getElementById('metadata-file-input');
    const file = fileInput.files[0];

    if (!file) {
        showToast('파일을 선택해주세요.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        parseAndFill(text);
    };
    reader.onerror = () => {
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
    };
    reader.readAsText(file);
}


function handleFillFromText() {
    const textInput = document.getElementById('metadata-text-input');
    const text = textInput.value.trim();
    if (!text) {
        showToast('메타데이터 내용을 붙여넣어 주세요.', 'warning');
        return;
    }
    parseAndFill(text);
}


function parseAndFill(text) {
    let specData;
    text = text.trim();

    try {
        if (text.startsWith('{')) {

            const metadata = JSON.parse(text);
            specData = {
                data_name: metadata.name || '',
                provider: (metadata.creator && metadata.creator.name) || '',
                description: metadata.description || '',
                reference_doc_url: metadata.url || '',
                keywords: Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : (metadata.keywords || ''),
            };
        } else if (text.startsWith('<')) {

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "application/xml");

            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {

                throw new Error('RDF/XML 파싱 중 오류가 발생했습니다. 형식을 확인해주세요.');
            }

            const dcatNS = "http:
            const dctNS = "http:
            const foafNS = "http:
            const rdfNS = "http:

            const datasetEl = xmlDoc.getElementsByTagNameNS(dcatNS, 'Dataset')[0];
            const searchContext = datasetEl || xmlDoc;

            const getText = (ns, tagName, lang = 'kr') => {
                const elements = Array.from(searchContext.getElementsByTagNameNS(ns, tagName));
                if (elements.length === 0) return '';
                const langEl = elements.find(el => el.getAttribute('xml:lang') === lang);
                return langEl ? langEl.textContent : (elements[0] ? elements[0].textContent : '');
            };

            const getResource = (ns, tagName) => {
                const el = searchContext.getElementsByTagNameNS(ns, tagName)[0];
                return el ? el.getAttributeNS(rdfNS, 'resource') : '';
            };

            const getKeywords = () => {
                const elements = Array.from(searchContext.getElementsByTagNameNS(dcatNS, 'keyword'));
                return elements
                    .filter(el => el.getAttribute('xml:lang') === 'kr')
                    .map(el => el.textContent)
                    .join(', ');
            };

            const getProvider = () => {
                const org = xmlDoc.getElementsByTagNameNS(foafNS, 'Organization')[0];
                if (org) {
                    const name = org.getElementsByTagNameNS(foafNS, 'name')[0];
                    return name ? name.textContent : '';
                }
                return '';
            }

            specData = {
                data_name: getText(dctNS, 'title'),
                provider: getProvider(),
                description: getText(dctNS, 'description'),
                reference_doc_url: getResource(dcatNS, 'landingPage'),
                keywords: getKeywords(),
            };
        } else {
            throw new Error('알 수 없는 형식입니다. JSON 또는 RDF/XML 형식의 데이터를 입력해주세요.');
        }


        ui.resetForm();
        ui.elements.modalTitle.textContent = '새 명세서 등록 (메타데이터)';
        ui.populateForm(specData);
        ui.openModal();

    } catch (error) {

        showToast(`메타데이터 처리 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


export function initializePage() {
    ui.initializeDOMElements();

    initializeEventListeners();
    loadSpecs();


    initCollapsibleFeatures();





}
