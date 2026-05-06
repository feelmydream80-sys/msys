
import { FIELD_DEFINITIONS, FIELD_LABELS, DEFAULT_COLUMNS, DISPLAY_OPTIONS, TOAST_TYPES } from './modules/constants.js';
import { getGroups, createItem, updateGroup, deleteGroup, updateDetail } from './modules/api.js';
import { showToast, createModal, getAddGroupModalHTML, getEditGroupModalHTML, getDetailModalHTML } from './modules/ui.js';
import { formatDateTime, toKST } from '../../modules/common/dateUtils.js';


let selectedGroup = null;
let selectedRow = null;
let isInitialized = false;
let allData = null;
let detailSortState = { column: 'cd', direction: 'asc' };


function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

export async function init() {
    
    

    if (isInitialized) {
        
        return;
    }
    

    isInitialized = true;
    selectedGroup = null;
    selectedRow = null;
    window.isModalOpen = false;
    allData = null;
    

    const existingModal = document.querySelector('div[style*="rgba(0,0,0,0.5)"]');
    if (existingModal) {
        existingModal.remove();
    }
    

    setupUIElements();
    setupEventListeners();
    

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGroupActionButtons);
    } else {
        setupGroupActionButtons();
    }
    

    try {
        await renderGroupCards();
        
    } catch (error) {
        

        const container = document.getElementById('definitionCardContainer');
        container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">데이터 정의 탭 초기화에 실패했습니다. 페이지를 새로고침해 주세요.</div>';
    } finally {

        isInitialized = false;
    }
}


function setupUIElements() {

    const existingSearchContainer = document.getElementById('dataDefinitionSearch')?.parentElement;
    if (existingSearchContainer) {
        
        return;
    }
    

    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'margin-bottom: 20px; display: flex; gap: 15px; align-items: center;';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '검색어 입력 (코드+명칭)';
    searchInput.id = 'dataDefinitionSearch';
    searchInput.style.cssText = 'flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';
    
    const displayOptions = document.createElement('div');
    displayOptions.style.cssText = 'display: flex; gap: 15px; align-items: center; font-size: 14px;';
    
    DISPLAY_OPTIONS.forEach(option => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="displayOption" value="${option.value}" ${option.default ? 'checked' : ''}> ${option.label}`;
        displayOptions.appendChild(label);
    });
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(displayOptions);
    

    const cardContainer = document.getElementById('definitionCardContainer');
    if (cardContainer && cardContainer.parentNode) {
        cardContainer.parentNode.insertBefore(searchContainer, cardContainer);
    }
    

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterGroups(searchTerm);
    });
    

    document.querySelectorAll('input[name="displayOption"]').forEach(radio => {
        radio.addEventListener('change', updateDisplayOption);
    });
}


function filterGroups(searchTerm) {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent;
        const matches = title.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (matches) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}


function updateDisplayOption() {
    const selectedOption = document.querySelector('input[name="displayOption"]:checked').value;
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const titleElement = card.querySelector('.card-title');
        const originalText = titleElement.dataset.originalText || titleElement.textContent;
        

        if (!titleElement.dataset.originalText) {
            titleElement.dataset.originalText = originalText;
        }
        

        if (selectedOption === 'codeName') {
            titleElement.textContent = originalText;
            card.style.display = 'block';
        } else if (selectedOption === 'name') {
            const nameMatch = originalText.match(/- (.+)$/);
            titleElement.textContent = nameMatch ? nameMatch[1] : originalText;
            card.style.display = 'block';
        } else if (selectedOption === 'deleted') {
            const isInactive = card.classList.contains('inactive-group');
            if (isInactive) {
                const codeMatch = originalText.match(/(CD\d+)/);
                titleElement.textContent = codeMatch ? codeMatch[1] : originalText;
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
    

    const searchTerm = document.getElementById('dataDefinitionSearch').value.toLowerCase();
    filterGroups(searchTerm);
}


async function renderGroupCards() {
    const container = document.getElementById('definitionCardContainer');
    container.innerHTML = '';

    try {

        
        allData = await getGroups();
        
        
        if (allData && allData.length > 0) {

            const groupedData = {};
            
            allData.forEach(item => {
                const cd_cl = item.cd_cl;
                if (cd_cl && /^CD\d*00$/.test(cd_cl)) {
                    if (!groupedData[cd_cl]) {
                        const groupHeader = allData.find(headerItem => 
                            headerItem.cd_cl === cd_cl && headerItem.cd === cd_cl
                        );
                        
                        const groupName = groupHeader ? groupHeader.cd_nm : item.cd_nm;
                        
                        groupedData[cd_cl] = {
                            cd: cd_cl,
                            cd_nm: groupName,
                            count: 0,
                            activeCount: 0,
                            inactiveCount: 0,
                            details: [],
                            use_yn: groupHeader ? groupHeader.use_yn : 'Y'
                        };
                    }
                }
            });
            
            allData.forEach(item => {
                const cd_cl = item.cd_cl;
                const cdValue = item.cd;
                
                if (cdValue && !/^CD\d*00$/.test(cdValue)) {
                    if (groupedData[cd_cl]) {
                        groupedData[cd_cl].details.push(item);
                        groupedData[cd_cl].count++;
                        if (item.use_yn && item.use_yn.trim() === 'Y') {
                            groupedData[cd_cl].activeCount++;
                        } else {
                            groupedData[cd_cl].inactiveCount++;
                        }
                    }
                }
            });
            
            const groups = Object.values(groupedData);
            
            
            groups.sort((a, b) => {
                const numA = parseInt(a.cd.replace('CD', ''));
                const numB = parseInt(b.cd.replace('CD', ''));
                return numA - numB;
            });
            
            groups.forEach(group => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.cd = group.cd;
                
                if (group.use_yn && group.use_yn.trim() === 'N') {
                    card.className = 'card inactive-group';
                }
                
                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-title" data-original-text="${group.cd} - ${group.cd_nm}">${group.cd} - ${group.cd_nm}</div>
                        <div style="font-size:0.9rem;color:#666;">총 ${group.count}건</div>
                    </div>
                    <div class="status-group">
                        <div class="status-item status-success">
                            <div>사용중</div>
                            <div style="font-weight:600;font-size:1.1rem;">${group.activeCount}</div>
                        </div>
                        <div class="status-item status-fail">
                            <div>사용안함</div>
                            <div style="font-weight:600;font-size:1.1rem;">${group.inactiveCount}</div>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => selectGroup(group));
                container.appendChild(card);
            });
            
            updateDisplayOption();
        } else {
            container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">그룹 데이터를 불러오지 못했습니다.</div>';
        }
    } catch (error) {
        
        container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">그룹 데이터를 불러오지 못했습니다.</div>';
    }
}


function selectGroup(group) {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    

    const selectedCard = document.querySelector(`.card[data-cd="${group.cd}"]`);
    
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedGroup = group;
        loadGroupDetails(group.cd);
    } else {
        
    }
}


let currentPage = 1;
let itemsPerPage = 10;
const itemsPerPageOptions = [5, 10, 20, 50, 100];


async function loadGroupDetails(groupCd) {
    
    

    selectedRow = null;
    currentPage = 1;
    
    const detailPanel = document.getElementById('detailPanel');
    const selectedGroupTitle = document.getElementById('selectedGroupTitle');
    const detailTableBody = document.getElementById('detailTableBody');

    const totalItems = allData.filter(item => item.cd_cl === groupCd && item.cd !== groupCd).length;
    selectedGroupTitle.textContent = `${selectedGroup.cd} - ${selectedGroup.cd_nm} (${totalItems} 건)`;
    detailTableBody.innerHTML = '';

    if (!allData) {
        allData = await getGroups();
    }
    
    const groupDetails = allData.filter(item => item.cd_cl === groupCd && item.cd !== groupCd) || [];

    updateDetailTableHeader();


    renderPagedDetails(groupDetails);

    detailPanel.style.display = 'block';
    
    const buttonContainer = document.getElementById('buttonContainer');
    if (buttonContainer) {
        buttonContainer.innerHTML = '';
        

        const itemsPerPageSelect = document.createElement('select');
        itemsPerPageSelect.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 15px;';
        itemsPerPageOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = `${option} 건`;
            if (option === itemsPerPage) {
                optionElement.selected = true;
            }
            itemsPerPageSelect.appendChild(optionElement);
        });
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderPagedDetails(groupDetails);
            updatePagination(groupDetails);
        });
        
        const activateBtn = document.createElement('button');
        activateBtn.id = 'activateBtn';
        activateBtn.textContent = '활성화';
        activateBtn.className = 'btn btn-success';
        activateBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;';
        activateBtn.disabled = true;
        activateBtn.addEventListener('click', () => activateSelectedItems());
        
        const deactivateBtn = document.createElement('button');
        deactivateBtn.id = 'deactivateBtn';
        deactivateBtn.textContent = '비활성화';
        deactivateBtn.className = 'btn btn-danger';
        deactivateBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;';
        deactivateBtn.disabled = true;
        deactivateBtn.addEventListener('click', () => deactivateSelectedItems());
        
        const addDetailBtn = document.createElement('button');
        addDetailBtn.textContent = '추가';
        addDetailBtn.className = 'btn btn-primary';
        addDetailBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;';
        addDetailBtn.addEventListener('click', () => showAddDetailModal(selectedGroup));
        
        const editBtn = document.createElement('button');
        editBtn.id = 'editBtn';
        editBtn.textContent = '수정';
        editBtn.className = 'btn';
        editBtn.style.cssText = 'padding: 10px 20px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; margin-right: 10px;';
        editBtn.disabled = true;
        editBtn.addEventListener('click', () => {
            if (selectedRow) {
                showEditModal(selectedRow.item);
            } else {
                showToast('데이터를 선택해주세요.', TOAST_TYPES.WARNING);
            }
        });

        buttonContainer.appendChild(itemsPerPageSelect);
        buttonContainer.appendChild(activateBtn);
        buttonContainer.appendChild(deactivateBtn);
        buttonContainer.appendChild(addDetailBtn);
        buttonContainer.appendChild(editBtn);
    }
    

    const detailTable = document.querySelector('#detailPanel table');
    if (detailTable && groupDetails.length > itemsPerPage) {

        const existingPagination = document.getElementById('detailPagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'detailPagination';
        paginationContainer.style.cssText = 'margin-top: 15px; display: flex; gap: 5px; justify-content: center;';
        
        const totalPages = Math.ceil(groupDetails.length / itemsPerPage);
        

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '이전';
        prevBtn.className = 'btn';
        prevBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPagedDetails(groupDetails);
                updatePagination(groupDetails);
            }
        });
        

        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.style.cssText = 'display: flex; gap: 5px;';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : ''}`;
            pageBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
            if (i === currentPage) {
                pageBtn.style.backgroundColor = '#007bff';
                pageBtn.style.color = 'white';
                pageBtn.style.borderColor = '#007bff';
            }
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderPagedDetails(groupDetails);
                updatePagination(groupDetails);
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
        

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '다음';
        nextBtn.className = 'btn';
        nextBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPagedDetails(groupDetails);
                updatePagination(groupDetails);
            }
        });
        
        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageNumbersContainer);
        paginationContainer.appendChild(nextBtn);
        detailTable.parentNode.appendChild(paginationContainer);
    }
    
    updateActionButtons();
    
}


function renderPagedDetails(groupDetails) {
    const detailTableBody = document.getElementById('detailTableBody');
    detailTableBody.innerHTML = '';
    

    const sortedData = [...groupDetails].sort((a, b) => {
        const { column, direction } = detailSortState;
        let valA = a[column];
        let valB = b[column];
        

        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        

        if (column === 'update_dt') {
            const dateA = toKST(valA);
            const dateB = toKST(valB);
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return direction === 'asc' ? -1 : 1;
        if (strA > strB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pagedData = sortedData.slice(startIndex, endIndex);
    
    if (pagedData.length > 0) {
        pagedData.forEach(item => {
            const row = renderDetailRow(item);
            detailTableBody.appendChild(row);
        });
    } else {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" style="text-align: center; color: #94a3b8;">데이터가 없습니다.</td>';
        detailTableBody.appendChild(emptyRow);
    }
}


function updatePagination(groupDetails) {
    const paginationContainer = document.getElementById('detailPagination');
    if (!paginationContainer) {
        return;
    }
    
    const totalPages = Math.ceil(groupDetails.length / itemsPerPage);
    const pageNumbersContainer = paginationContainer.querySelector('div:nth-child(2)');
    

    const pageButtons = pageNumbersContainer.querySelectorAll('button');
    pageButtons.forEach((btn, index) => {
        const pageNumber = index + 1;
        if (pageNumber === currentPage) {
            btn.className = 'btn btn-primary';
            btn.style.backgroundColor = '#007bff';
            btn.style.color = 'white';
            btn.style.borderColor = '#007bff';
        } else {
            btn.className = 'btn';
            btn.style.backgroundColor = 'white';
            btn.style.color = 'black';
            btn.style.borderColor = '#ddd';
        }
    });
    

    const prevBtn = paginationContainer.querySelector('button:first-child');
    const nextBtn = paginationContainer.querySelector('button:last-child');
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}


async function deactivateSelectedItems() {
    const selectedCheckboxes = document.querySelectorAll('#detailTableBody input[type="checkbox"]:checked');
    const selectedItems = [];
    
    selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const cd = row.querySelector('td:nth-child(2)').textContent;
        selectedItems.push(cd);
    });
    
    if (selectedItems.length < 1) {
        showToast('비활성화할 항목을 선택해주세요.', TOAST_TYPES.WARNING);
        return;
    }
    
    try {
        for (const cd of selectedItems) {
            await updateDetail(cd, { use_yn: 'N', cd_cl: selectedGroup.cd });
        }
        
        showToast(`선택된 ${selectedItems.length}개의 항목이 비활성화되었습니다.`, TOAST_TYPES.SUCCESS);
        allData = await getGroups();
        await loadGroupDetails(selectedGroup.cd);
        await renderGroupCards();
    } catch (error) {
        
        showToast('항목 비활성화에 실패했습니다.', TOAST_TYPES.ERROR);
    }
}


function updateDetailTableHeader() {
    const detailTable = document.querySelector('#detailPanel table');
    const thead = detailTable.querySelector('thead');
    
    thead.innerHTML = '';
    
    const headerRow = document.createElement('tr');
    
    const checkboxTh = document.createElement('th');
    const headerCheckbox = document.createElement('input');
    headerCheckbox.type = 'checkbox';
    headerCheckbox.id = 'headerCheckbox';
    headerCheckbox.addEventListener('change', toggleAllCheckboxes);
    checkboxTh.appendChild(headerCheckbox);
    headerRow.appendChild(checkboxTh);
    
    DEFAULT_COLUMNS.forEach(col => {
        const th = document.createElement('th');
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';
        th.style.transition = 'background-color 0.2s';
        th.addEventListener('click', () => handleDetailSort(col.key));
        
        const labelSpan = document.createElement('span');
        labelSpan.textContent = col.label;
        th.appendChild(labelSpan);
        
        const sortIcon = document.createElement('span');
        sortIcon.style.marginLeft = '4px';
        sortIcon.style.fontSize = '12px';
        sortIcon.style.color = '#94a3b8';
        
        if (detailSortState.column === col.key) {
            sortIcon.textContent = detailSortState.direction === 'asc' ? '↑' : '↓';
            sortIcon.style.color = '#007bff';
            th.style.backgroundColor = '#e6f7ee';
        } else {
            sortIcon.textContent = '↕';
        }
        
        th.appendChild(sortIcon);
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
}


function handleDetailSort(column) {
    if (detailSortState.column === column) {
        detailSortState.direction = detailSortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        detailSortState.column = column;
        detailSortState.direction = 'asc';
    }
    

    if (selectedGroup) {
        loadGroupDetails(selectedGroup.cd);
    }
}


function toggleAllCheckboxes() {
    const headerCheckbox = document.getElementById('headerCheckbox');
    const rowCheckboxes = document.querySelectorAll('#detailTableBody input[type="checkbox"]');
    
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = headerCheckbox.checked;
    });
    
    updateActionButtons();
}


async function activateSelectedItems() {
    const selectedCheckboxes = document.querySelectorAll('#detailTableBody input[type="checkbox"]:checked');
    const selectedItems = [];
    
    selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const cd = row.querySelector('td:nth-child(2)').textContent;
        selectedItems.push(cd);
    });
    
    if (selectedItems.length < 1) {
        showToast('활성화할 항목을 선택해주세요.', TOAST_TYPES.WARNING);
        return;
    }
    
    try {
        for (const cd of selectedItems) {
            await updateDetail(cd, { use_yn: 'Y', cd_cl: selectedGroup.cd });
        }
        
        showToast(`선택된 ${selectedItems.length}개의 항목이 활성화되었습니다.`, TOAST_TYPES.SUCCESS);
        allData = await getGroups();
        await loadGroupDetails(selectedGroup.cd);
        await renderGroupCards();
    } catch (error) {
        
        showToast('항목 활성화에 실패했습니다.', TOAST_TYPES.ERROR);
    }
}


function renderDetailRow(item) {
    const row = document.createElement('tr');
    
    if (!item.use_yn || item.use_yn.trim() === 'N') {
        row.className = 'inactive-row';
    }
    
    row.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            updateActionButtons();
            return;
        }
        
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        
        selectDetailRow(row, item);
    });
    

    row.addEventListener('dblclick', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            return;
        }
        
        showEditModal(item);
    });
    
    row.innerHTML = `
        <td><input type="checkbox" onchange="updateActionButtons()"></td>
        <td>${item.cd}</td>
        <td>${item.cd_nm}</td>
        <td>${item.cd_desc || ''}</td>
        <td>${(item.use_yn && item.use_yn.trim() === 'Y') ? '사용중' : '사용안함'}</td>
        <td>${item.update_dt ? formatDateTime(item.update_dt, 'YYYY-MM-DD HH:mm:ss') : ''}</td>
    `;
    
    
    
    return row;
}


function selectDetailRow(row, item) {
    document.querySelectorAll('#detailTableBody tr').forEach(r => r.style.backgroundColor = '');
    
    row.style.backgroundColor = '#e6f7ee';
    selectedRow = { row, item };
    
    updateActionButtons();
}


function updateActionButtons() {
    const editBtn = document.getElementById('editBtn');
    const activateBtn = document.getElementById('activateBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const addDetailBtn = document.querySelector('#buttonContainer .btn-primary');
    
    
    
    
    
    const selectedCheckboxes = document.querySelectorAll('#detailTableBody input[type="checkbox"]:checked');
    const selectedCount = selectedCheckboxes.length;
    
    if (selectedCount > 0) {
        activateBtn.disabled = false;
        deactivateBtn.disabled = false;
        addDetailBtn.disabled = true;
        editBtn.disabled = !selectedRow;
    } else {
        activateBtn.disabled = true;
        deactivateBtn.disabled = true;
        addDetailBtn.disabled = false;
        
        if (selectedRow) {
            editBtn.disabled = false;
        } else {
            editBtn.disabled = true;
        }
    }
    

    
}


function setupEventListeners() {
    if (setupEventListeners.hasRun) {
        return;
    }
    setupEventListeners.hasRun = true;

    const editBtn = document.getElementById('editBtn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (selectedRow) {
                showEditModal(selectedRow.item);
            } else {
                showToast('데이터를 선택해주세요.', TOAST_TYPES.WARNING);
            }
        });
    }
}
setupEventListeners.hasRun = false;


function setupGroupActionButtons() {

    
    
    const addGroupBtn = document.getElementById('addGroupBtn');
    const editGroupBtn = document.getElementById('editGroupBtn');
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');

    
    
    
    

    if (addGroupBtn) {

        addGroupBtn.removeEventListener('click', handleAddGroupClick);
        addGroupBtn.addEventListener('click', handleAddGroupClick);
    }

    if (editGroupBtn) {

        editGroupBtn.removeEventListener('click', handleEditGroupClick);
        editGroupBtn.addEventListener('click', handleEditGroupClick);
    }

    if (deleteGroupBtn) {

        deleteGroupBtn.removeEventListener('click', handleDeleteGroupClick);
        deleteGroupBtn.addEventListener('click', handleDeleteGroupClick);
    }
}


function handleAddGroupClick() {
    
    showAddGroupModal();
}

function handleEditGroupClick() {
    if (selectedGroup) {
        showEditGroupModal(selectedGroup);
    } else {
        alert('수정할 그룹을 먼저 선택해주세요.');
    }
}

function handleDeleteGroupClick() {
    if (selectedGroup) {
        showDeleteGroupConfirm(selectedGroup);
    } else {
        alert('삭제할 그룹을 먼저 선택해주세요.');
    }
}


async function showAddGroupModal() {
    if (window.isModalOpen === true) {
        
        return;
    }

    window.isModalOpen = true;

    if (!allData) {
        allData = await getGroups();
    }

    const { modal, modalContent, saveBtn } = createModal(getAddGroupModalHTML(), {
        title: '새 그룹 추가',
        width: '1800px',
        saveText: '추가',
        saveDisabled: true
    });

    saveBtn.addEventListener('click', async () => {
        const cd_cl = 'CD' + document.getElementById('newGroupCdCl').value.trim();
        const cdInput = document.getElementById('newGroupCd').value.trim();
        const cd = 'CD' + cdInput;
        const cd_nm = document.getElementById('newGroupNm').value.trim();
        const cd_desc = document.getElementById('newGroupDesc').value.trim();
        const item1 = document.getElementById('newGroupItem1').value.trim();
        const item2 = document.getElementById('newGroupItem2').value.trim();
        const item3 = document.getElementById('newGroupItem3').value.trim();
        const item4 = document.getElementById('newGroupItem4').value.trim();
        const item5 = document.getElementById('newGroupItem5').value.trim();
        const item6 = document.getElementById('newGroupItem6').value.trim();
        const item7 = document.getElementById('newGroupItem7').value.trim();
        const item8 = document.getElementById('newGroupItem8').value.trim();
        const item9 = document.getElementById('newGroupItem9').value.trim();
        const item10 = document.getElementById('newGroupItem10').value.trim();

        const existingGroup = allData.find(item => item.cd === cd && item.use_yn === 'N');
        
        if (existingGroup) {
            const confirmActivate = confirm(`이 그룹은 이미 비활성화된 상태입니다.\n그룹을 활성화하시겠습니까?`);
            if (confirmActivate) {
                const updateData = {
                    cd_cl: cd_cl,
                    cd: cd,
                    cd_nm: cd_nm,
                    cd_desc: cd_desc || '',
                    item1: item1 || '',
                    item2: item2 || '',
                    item3: item3 || '',
                    item4: item4 || '',
                    item5: item5 || '',
                    item6: item6 || '',
                    item7: item7 || '',
                    item8: item8 || '',
                    item9: item9 || '',
                    item10: item10 || '',
                    use_yn: 'Y'
                };
                
                try {
            await updateGroup(cd, updateData);
                    alert('그룹이 활성화되었습니다.');
                    window.isModalOpen = false;
                    document.body.removeChild(modal);
                    allData = await getGroups();
                    await renderGroupCards();
                } catch (error) {
                    
                    alert('그룹 활성화에 실패했습니다.');
                }
            } else {
                return;
            }
        } else {
            const newGroupData = {
                cd_cl: cd,
                cd: cd,
                cd_nm: cd_nm,
                cd_desc: cd_desc || '',
                item1: item1 || '',
                item2: item2 || '',
                item3: item3 || '',
                item4: item4 || '',
                item5: item5 || '',
                item6: item6 || '',
                item7: item7 || '',
                item8: item8 || '',
                item9: item9 || '',
                item10: item10 || '',
                use_yn: 'Y'
            };

            try {
                await createItem(newGroupData);
                alert('새 그룹이 추가되었습니다.');
                window.isModalOpen = false;
                document.body.removeChild(modal);
                allData = await getGroups();
                await renderGroupCards();
            } catch (error) {
                
                alert('그룹 추가에 실패했습니다.');
            }
        }
    });

    const validateAddGroupModal = debounce(() => {
        const cdClInput = document.getElementById('newGroupCdCl');
        const cdInput = document.getElementById('newGroupCd');
        const cdNmInput = document.getElementById('newGroupNm');
        
        const cdClValue = cdClInput.value.trim();
        const cdValue = cdInput.value.trim();
        const cdNmValue = cdNmInput.value.trim();
        
        let isValid = true;
        
        if (!cdClValue) {
            isValid = false;
        } else {
            const cdClNum = parseInt(cdClValue);
            

            if (cdClNum >= 10000) {
                document.getElementById('newGroupCdClMaxError').style.display = 'block';
                document.getElementById('newGroupCdClFormatError').style.display = 'none';
                document.getElementById('newGroupCdClError').style.display = 'none';
                cdClInput.style.borderColor = '#dc3545';
                isValid = false;
            } else if (isNaN(cdClNum) || cdClNum % 100 !== 0) {
                document.getElementById('newGroupCdClMaxError').style.display = 'none';
                document.getElementById('newGroupCdClFormatError').style.display = 'block';
                document.getElementById('newGroupCdClError').style.display = 'none';
                cdClInput.style.borderColor = '#dc3545';
                isValid = false;
            } else {
                document.getElementById('newGroupCdClMaxError').style.display = 'none';
                document.getElementById('newGroupCdClFormatError').style.display = 'none';
                const exists = allData.some(item => item.cd === 'CD' + cdClValue);
                if (exists) {
                    document.getElementById('newGroupCdClError').style.display = 'block';
                    cdClInput.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    document.getElementById('newGroupCdClError').style.display = 'none';
                    cdClInput.style.borderColor = '#ddd';
                }
            }
        }
        
        if (!cdValue) {
            isValid = false;
        } else {
            const cdNum = parseInt(cdValue);
            

            if (cdNum >= 10000) {
                document.getElementById('newGroupCdMaxError').style.display = 'block';
                document.getElementById('newGroupCdRangeError').style.display = 'none';
                document.getElementById('newGroupCdError').style.display = 'none';
                cdInput.style.borderColor = '#dc3545';
                isValid = false;
            } else if (cdClValue) {
                const cdClNum = parseInt(cdClValue);
                document.getElementById('newGroupCdMaxError').style.display = 'none';
                
                if (cdNum < cdClNum || cdNum > cdClNum + 99) {
                    document.getElementById('newGroupCdRangeError').style.display = 'block';
                    document.getElementById('newGroupCdError').style.display = 'none';
                    cdInput.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    document.getElementById('newGroupCdRangeError').style.display = 'none';
                    const exists = allData.some(item => item.cd === 'CD' + cdValue);
                    if (exists) {
                        document.getElementById('newGroupCdError').style.display = 'block';
                        cdInput.style.borderColor = '#dc3545';
                        isValid = false;
                    } else {
                        document.getElementById('newGroupCdError').style.display = 'none';
                        cdInput.style.borderColor = '#ddd';
                    }
                }
            }
        }
        
        if (!cdNmValue) {
            isValid = false;
        }
        
        saveBtn.disabled = !isValid;
    }, 300);
    
    document.getElementById('newGroupCdCl').addEventListener('input', validateAddGroupModal);
    document.getElementById('newGroupCd').addEventListener('input', validateAddGroupModal);
    document.getElementById('newGroupNm').addEventListener('input', validateAddGroupModal);
}


async function showEditGroupModal(group) {
    try {
        if (!allData) {
            allData = await getGroups();
        }
        

        const groupHeader = allData.find(item => 
            item.cd_cl === group.cd && item.cd === group.cd
        );
        
        
        

        let safeGroupHeader = groupHeader;
        if (!safeGroupHeader) {
            
            const response = await fetch(`/api/data_definition/groups`);
            if (response.ok) {
                const data = await response.json();
                
                safeGroupHeader = data.find(item => item.cd_cl === group.cd && item.cd === group.cd) || {};
            } else {
                safeGroupHeader = {};
            }
        }
        
        createModal(getEditGroupModalHTML(group, safeGroupHeader), {
            title: '그룹 수정',
            width: '1800px',
            onSave: async () => {
                const cd_cl = document.getElementById('editGroupCdCl').value.trim();
                const cd_nm = document.getElementById('editGroupNm').value.trim();
                const cd_desc = document.getElementById('editGroupDesc').value.trim();
                
                const itemValues = {};
                const itemFields = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9', 'item10'];
                itemFields.forEach(key => {
                    const element = document.getElementById(`editGroup${key.charAt(0).toUpperCase() + key.slice(1)}`);
                    if (element) {
                        itemValues[key] = element.value.trim();
                    }
                });

                if (!cd_cl || !cd_nm) {
                    alert('그룹 코드(cd_cl)와 데이터 명칭(cd_nm)을 모두 입력해주세요.');
                    return;
                }

                const use_yn = document.getElementById('editGroupUseYn').value.trim() === 'Y' ? 'Y' : 'N';
                const updateData = {
                    cd_cl: cd_cl,
                    cd: group.cd,
                    cd_nm: cd_nm,
                    cd_desc: cd_desc || '',
                    ...itemValues,
                    use_yn: use_yn
                };

                try {
                    await updateGroup(group.cd, updateData);
                    

                    if (use_yn === 'Y') {
                        const groupDetails = allData.filter(item => item.cd_cl === group.cd && item.cd !== group.cd);
                        for (const detail of groupDetails) {
                            await updateDetail(detail.cd, { use_yn: 'Y', cd_cl: group.cd });
                        }
                    }
                    
                    alert('그룹이 수정되었습니다.');
                    allData = await getGroups();
                    await renderGroupCards();
                } catch (error) {
                    
                    alert('그룹 수정에 실패했습니다.');
                }
            }
        });
    } catch (error) {
        
        alert('그룹 데이터를 불러오는데 실패했습니다.');
    }
}


async function showDeleteGroupConfirm(group) {
    const confirmDelete = confirm(
        `그룹 코드: ${group.cd}\n그룹 명칭: ${group.cd_nm}\n\n이 그룹을 삭제하시겠습니까?\n(그룹 내 모든 데이터가 사용안함으로 변경됩니다)`
    );
    
    if (confirmDelete) {
            try {
                await deleteGroup(group.cd);
                alert('그룹이 사용안함으로 변경되었습니다.');
                allData = await getGroups();
                await renderGroupCards();

                const detailPanel = document.getElementById('detailPanel');
                if (detailPanel) {
                    detailPanel.style.display = 'none';
                }

                selectedGroup = null;
                selectedRow = null;
            } catch (error) {
                
                alert('그룹 삭제에 실패했습니다.');
            }
    }
}


async function showEditModal(item) {
    try {
        
        let groupItemFields = [];
        

        if (!allData || !Array.isArray(allData) || allData.length === 0) {
            
            allData = await getGroups();
        }
        

        let groupHeader = allData.find(header => header.cd_cl === item.cd_cl && header.cd === item.cd_cl);
        

        if (!groupHeader) {
            
            const response = await fetch(`/api/data_definition/groups`);
            if (response.ok) {
                const data = await response.json();
                groupHeader = data.find(header => header.cd_cl === item.cd_cl && header.cd === item.cd_cl);
            }
        }
        
        
        
        if (groupHeader) {
            const itemFields = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9', 'item10'];
            itemFields.forEach(key => {
                const value = groupHeader[key];
                if (value !== null && value !== undefined && value.toString().trim() !== '' && value.toString().toUpperCase() !== 'NULL') {
                    groupItemFields.push({
                        key: key,
                        label: value
                    });
                }
            });
        }
        
        
        
        createModal(getDetailModalHTML(`${item.cd} - ${item.cd_nm} 수정`, item, groupItemFields), {
            title: `${item.cd} - ${item.cd_nm} 수정`,
            width: '1800px',
            onSave: async () => {
                const cd_nm = document.getElementById('editDetailNm').value.trim();
                const cd_desc = document.getElementById('editDetailDesc').value.trim();
                const use_yn = document.getElementById('editDetailUseYn').value;

                if (!cd_nm) {
                    alert('데이터 명칭을 입력해주세요.');
                    return;
                }

                const itemValues = {};
                groupItemFields.forEach(field => {
                    itemValues[field.key] = document.getElementById(`editDetail${field.key}`)?.value.trim() || '';
                });

                const updateData = {
                    cd_cl: item.cd_cl,
                    cd: item.cd,
                    cd_nm: cd_nm,
                    cd_desc: cd_desc || '',
                    ...itemValues,
                    use_yn: use_yn
                };

                try {
                    await updateDetail(item.cd, updateData);
                    alert('데이터가 수정되었습니다.');
                    allData = await getGroups();
                    await loadGroupDetails(selectedGroup.cd);
                    await renderGroupCards();
                } catch (error) {
                    
                    alert('데이터 수정에 실패했습니다.');
                }
            }
        });
    } catch (error) {
        
        alert('상세 데이터를 불러오는데 실패했습니다.');
    }
}


async function showAddDetailModal(group) {
    try {
        let groupItemFields = [];
        if (!allData) {
            allData = await getGroups();
        }
        
        const groupHeader = allData.find(item => item.cd_cl === group.cd && item.cd === group.cd);
        if (groupHeader) {
            const itemFields = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9', 'item10'];
            itemFields.forEach(key => {
                const value = groupHeader[key];
                if (value !== null && value !== undefined && value.toString().trim() !== '' && value.toString().toUpperCase() !== 'NULL') {
                    groupItemFields.push({
                        key: key,
                        label: value
                    });
                }
            });
        }


        const groupDetails = allData.filter(item => item.cd_cl === group.cd && item.cd !== group.cd);
        const groupNum = parseInt(group.cd.replace('CD', ''));
        

        const usedCodes = new Set();
        groupDetails.forEach(item => {
            const codeNum = parseInt(item.cd.replace('CD', ''));
            if (!isNaN(codeNum)) {
                usedCodes.add(codeNum);
            }
        });


        let nextAvailableCode = null;
        let firstEmptyCode = null;
        let maxUsedCode = groupNum;
        
        for (let i = groupNum + 1; i <= groupNum + 99; i++) {
            if (!usedCodes.has(i)) {
                if (firstEmptyCode === null) {
                    firstEmptyCode = i;
                }
            } else {
                maxUsedCode = Math.max(maxUsedCode, i);
            }
        }


        if (firstEmptyCode !== null) {
            nextAvailableCode = firstEmptyCode;
        } else if (maxUsedCode < groupNum + 99) {
            nextAvailableCode = maxUsedCode + 1;
        }


        const isAllCodesUsed = nextAvailableCode === null;


        const modalOptions = {
            title: `${group.cd} - ${group.cd_nm} 추가`,
            width: '1800px',
            saveText: '추가',
            saveDisabled: isAllCodesUsed
        };

        const { modal, modalContent, saveBtn } = createModal(
            getDetailModalHTML(`${group.cd} - ${group.cd_nm} 추가`, null, groupItemFields, isAllCodesUsed, groupNum, nextAvailableCode), 
            modalOptions
        );


        if (!isAllCodesUsed && nextAvailableCode !== null) {
            const cdInput = document.getElementById('newDetailCd');
            if (cdInput) {
                cdInput.value = nextAvailableCode;

                cdInput.dispatchEvent(new Event('input'));
            }
        }

        const cdInput = document.getElementById('newDetailCd');

        if (!cdInput) {
            return;
        }

        cdInput.addEventListener('input', debounce(() => {
            const cdValue = cdInput.value.trim();
            const cdNum = parseInt(cdValue);
            const groupNum = parseInt(group.cd.replace('CD', ''));
            
            if (cdNum % 100 === 0) {
                document.getElementById('newDetailCdError').textContent = '데이터 코드는 100의 배수 값을 사용할 수 없습니다 (그룹에서만 사용 가능).';
                document.getElementById('newDetailCdError').style.display = 'block';
                cdInput.style.borderColor = '#dc3545';
                saveBtn.disabled = true;
            } else if (cdNum < groupNum || cdNum > groupNum + 99) {
                document.getElementById('newDetailCdError').textContent = `데이터 코드는 ${group.cd} ~ ${'CD' + (groupNum + 99)} 범위 내에서만 사용할 수 있습니다.`;
                document.getElementById('newDetailCdError').style.display = 'block';
                cdInput.style.borderColor = '#dc3545';
                saveBtn.disabled = true;
            } else {
                document.getElementById('newDetailCdError').style.display = 'none';
                cdInput.style.borderColor = '#ddd';
                validateAddModal();
            }
        }, 300));

        const validateAddModal = debounce(() => {
            const cdValue = document.getElementById('newDetailCd').value.trim();
            const cd_nm = document.getElementById('newDetailNm').value.trim();
            
            
            
            let isValid = true;
            
            if (!cdValue || !cd_nm) {
                
                isValid = false;
            } else {
                const cdNum = parseInt(cdValue);
                const groupNum = parseInt(group.cd.replace('CD', ''));
                
                
                
                if (isNaN(cdNum) || cdNum % 100 === 0 || cdNum < groupNum || cdNum > groupNum + 99) {
                    
                    isValid = false;
                } else {
                    const cd = 'CD' + cdValue;
                    const exists = allData.some(item => item.cd_cl === group.cd && item.cd === cd);
                    
                    if (exists) {
                        
                        isValid = false;
                        document.getElementById('newDetailCdError').textContent = '이미 존재하는 데이터 코드입니다.';
                        document.getElementById('newDetailCdError').style.display = 'block';
                        cdInput.style.borderColor = '#dc3545';
                    } else if (!document.getElementById('newDetailCdError').textContent.includes('이미 존재')) {
                        document.getElementById('newDetailCdError').style.display = 'none';
                        cdInput.style.borderColor = '#ddd';
                    }
                }
            }
            
            
            saveBtn.disabled = !isValid;
            
        }, 300);
        
        document.getElementById('newDetailCd').addEventListener('input', validateAddModal);
        document.getElementById('newDetailNm').addEventListener('input', validateAddModal);

        saveBtn.addEventListener('click', async () => {
            const cdValue = document.getElementById('newDetailCd').value.trim();
            const cd_nm = document.getElementById('newDetailNm').value.trim();
            const cd_desc = document.getElementById('newDetailDesc').value.trim();
            const use_yn = document.getElementById('newDetailUseYn').value;

            if (!cdValue || !cd_nm) {
                alert('데이터 코드와 명칭을 모두 입력해주세요.');
                return;
            }

            const cd = 'CD' + cdValue;
            const itemValues = {};
            groupItemFields.forEach(field => {
                itemValues[field.key] = document.getElementById(`newDetail${field.key}`)?.value.trim() || '';
            });

            const newDetailData = {
                cd_cl: group.cd,
                cd: cd,
                cd_nm: cd_nm,
                cd_desc: cd_desc || '',
                ...itemValues,
                use_yn: use_yn
            };

            try {
                
                
                await createItem(newDetailData);
                alert('새 데이터가 추가되었습니다.');
                document.body.removeChild(modal);
                allData = await getGroups();
                await loadGroupDetails(group.cd);
                await renderGroupCards();
                

                
                try {

                    await import('../../modules/common/dataManager.js').then(async (dataManager) => {
                        const refreshedData = await dataManager.refreshAdminSettings();
                        
                        
                        

                        if (typeof window.loadPageData === 'function') {
                            
                            window.loadPageData();
                            
                        } else {
                            
                        }
                    });
                } catch (error) {
                    
                    
                }
            } catch (error) {
                
                
                alert('데이터 추가에 실패했습니다.');
            }
        });
    } catch (error) {
        
        alert('상세 데이터를 불러오는데 실패했습니다.');
    }
}


function getDefinedFieldsForGroup(groupCd) {
    const groupCode = groupCd.substring(0, 4);
    
    return FIELD_DEFINITIONS[groupCode] || [];
}


async function checkGroupCodeDuplicate(inputId) {
    const inputElement = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');
    const code = 'CD' + inputElement.value.trim();
    
    if (!code || code === 'CD') {
        errorElement.style.display = 'none';
        inputElement.style.borderColor = '#ddd';
        return;
    }
    
    try {
        if (!allData) {
            allData = await getGroups();
        }
        
        const exists = allData.some(item => item.cd === code);
        
        if (exists) {
            errorElement.style.display = 'block';
            inputElement.style.borderColor = '#dc3545';
        } else {
            errorElement.style.display = 'none';
            inputElement.style.borderColor = '#ddd';
        }
    } catch (error) {
        
        errorElement.style.display = 'none';
        inputElement.style.borderColor = '#ddd';
    }
}


function getFieldLabel(key) {
    return FIELD_LABELS[key] || key;
}