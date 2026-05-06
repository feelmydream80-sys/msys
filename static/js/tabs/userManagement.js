


import { userManagementApi } from '../services/api.js';
import { showToast } from '../utils.js';
import { isValidUserId } from '../validators.js';


class UserManagementTab {
    
    constructor() {

        this.elements = {
            tab: null,
            searchInput: null,
            tableBody: null,
            saveAllPermissionsBtn: null,
            bulkAddUsersBtn: null
        };
        

        this.debounceTimer = null;
        

        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.totalUsers = 0;
    }

    
    initElements() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return false;

        this.elements.tab = container.querySelector('button[data-tab="userManagement"]');
        this.elements.searchInput = container.querySelector('#userSearchInput');
        this.elements.tableBody = container.querySelector('#userTableBody');
        this.elements.saveAllPermissionsBtn = container.querySelector('#saveAllPermissionsBtn');
        this.elements.bulkAddUsersBtn = container.querySelector('#bulkAddUsersBtn');

        return true;
    }

    
    initEventListeners() {
        if (this.elements.tab) {
            this.elements.tab.addEventListener('click', () => this.refreshTable());
        }

        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.refreshTable();
                }, 300);
            });
        }

        if (this.elements.saveAllPermissionsBtn) {
            this.elements.saveAllPermissionsBtn.addEventListener('click', () => this.saveAllPermissions());
        }

        if (this.elements.bulkAddUsersBtn) {
            this.elements.bulkAddUsersBtn.addEventListener('click', () => this.showBulkUserInputModal());
        }
    }

    
    async refreshTable() {
        const searchTerm = this.elements.searchInput ? this.elements.searchInput.value : '';
        const { users, menus } = await this.fetchUsersAndMenus(searchTerm);
        this.renderTable(users, menus);
    }

    
    async fetchUsersAndMenus(searchTerm = '') {
        try {
            const data = await userManagementApi.getUsers(searchTerm);
            return { users: data.users || [], menus: data.menus || [] };
        } catch (error) {
            showToast(error.message, 'error');
            return { users: [], menus: [] };
        }
    }

    
    renderTable(users, menus) {




        if (users && users.length > 0) {
            const firstUser = users[0];






        }


        
        if (!this.elements.tableBody) return;


        const allMenus = menus.map(m => m.menu_id === 'admin' ? { ...m, menu_id: 'mngr_sett', menu_nm: '관리자 설정' } : m);
        

        allMenus.sort((a, b) => a.menu_ord - b.menu_ord);


        let menuHeaderHtml = allMenus.map(menu => `<th>${menu.menu_nm}</th>`).join('');
        const headerRow = `<tr><th>사용자 ID</th><th>작업</th><th>상태</th><th>가입일</th>${menuHeaderHtml}</tr>`;
        this.elements.tableBody.parentElement.querySelector('thead').innerHTML = headerRow;


        this.elements.tableBody.innerHTML = '';
        users.sort((a, b) => {

            if (a.is_admin !== b.is_admin) {
                return a.is_admin ? -1 : 1;
            }


            const dateA = new Date(a.created_at || a.acc_cre_dt || 0);
            const dateB = new Date(b.created_at || b.acc_cre_dt || 0);
            return dateB - dateA;
        });
        

        this.totalUsers = users.length;
        this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pagedUsers = users.slice(startIndex, endIndex);
        
        pagedUsers.forEach(user => {
            const row = document.createElement('tr');

            const createdAtRaw = user.created_at || user.acc_cre_dt;
            const createdAt = createdAtRaw ? new Date(createdAtRaw).toLocaleDateString('ko-KR') : 'N/A';


            const userStatus = user.status || user.acc_sts || 'UNKNOWN';


            let permissionsHtml = allMenus.map(menu => {
                const isChecked = user.permissions.includes(menu.menu_id) ? 'checked' : '';
                return `<td><input type="checkbox" class="permission-checkbox" data-user-id="${user.user_id}" data-menu-id="${menu.menu_id}" ${isChecked}></td>`;
            }).join('');


            let actionHtml = '';
            if (userStatus === 'PENDING' || userStatus === 'PENDING_RESET') {
                actionHtml = `<button class="approve-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs" data-user-id="${user.user_id}">승인</button> <button class="reject-btn bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs" data-user-id="${user.user_id}">거절</button>`;
            } else {
                actionHtml = `<button class="reset-password-btn bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-xs" data-user-id="${user.user_id}">비밀번호 초기화</button> <button class="delete-user-btn bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-xs" data-user-id="${user.user_id}">삭제</button>`;
            }

            row.innerHTML = `<td>${user.user_id}</td><td>${actionHtml}</td><td>${userStatus}</td><td>${createdAt}</td>${permissionsHtml}`;
            this.elements.tableBody.appendChild(row);
        });

        this.addEventListenersToButtons();


        this.renderPagination();
    }

    
    renderPagination() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return;


        const existingPagination = container.querySelector('#userManagementPagination');
        if (existingPagination) {
            existingPagination.remove();
        }


        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'userManagementPagination';
        paginationContainer.className = 'flex justify-center items-center gap-2 mt-4';


        const prevBtn = document.createElement('button');
        prevBtn.textContent = '이전';
        prevBtn.className = 'btn';
        prevBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.refreshTable();
            }
        });


        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.style.cssText = 'display: flex; gap: 5px;';

        for (let i = 1; i <= this.totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `btn ${i === this.currentPage ? 'btn-primary' : ''}`;
            pageBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
            if (i === this.currentPage) {
                pageBtn.style.backgroundColor = '#007bff';
                pageBtn.style.color = 'white';
                pageBtn.style.borderColor = '#007bff';
            }
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.refreshTable();
            });
            pageNumbersContainer.appendChild(pageBtn);
        }


        const nextBtn = document.createElement('button');
        nextBtn.textContent = '다음';
        nextBtn.className = 'btn';
        nextBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        nextBtn.disabled = this.currentPage === this.totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.refreshTable();
            }
        });


        const itemsPerPageSelect = document.createElement('select');
        itemsPerPageSelect.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 15px;';
        [5, 10, 20, 50, 100].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = `${option} 건`;
            if (option === this.itemsPerPage) {
                optionElement.selected = true;
            }
            itemsPerPageSelect.appendChild(optionElement);
        });
        itemsPerPageSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.refreshTable();
        });

        paginationContainer.appendChild(itemsPerPageSelect);
        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageNumbersContainer);
        paginationContainer.appendChild(nextBtn);


        const userTable = container.querySelector('#userTableBody').parentElement.parentElement;
        if (userTable) {
            userTable.parentNode.appendChild(paginationContainer);
        }
    }

    
    addEventListenersToButtons() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return;
        
        container.querySelectorAll('.approve-btn').forEach(b => 
            b.addEventListener('click', e => this.approveUser(e.target.dataset.userId)));
        container.querySelectorAll('.reject-btn').forEach(b => 
            b.addEventListener('click', e => { 
                if (confirm(`'${e.target.dataset.userId}' 사용자의 가입 신청을 거절하시겠습니까?`)) 
                    this.rejectUser(e.target.dataset.userId); 
            }));
        container.querySelectorAll('.reset-password-btn').forEach(b => 
            b.addEventListener('click', e => { 
                if (confirm(`'${e.target.dataset.userId}' 사용자의 비밀번호를 ID와 동일하게 초기화하시겠습니까?`)) 
                    this.resetPassword(e.target.dataset.userId); 
            }));
        container.querySelectorAll('.delete-user-btn').forEach(b => 
            b.addEventListener('click', e => { 
                if (confirm(`'${e.target.dataset.userId}' 사용자를 정말로 삭제하시겠습니까?`)) 
                    this.deleteUser(e.target.dataset.userId); 
            }));
    }

    
    async approveUser(userId) {
        try {
            const result = await userManagementApi.approveUser(userId);
            showToast(result.message, 'success');
            this.refreshTable();
        } catch (error) { 
            showToast(`승인 실패: ${error.message}`, 'error'); 
        }
    }

    
    async rejectUser(userId) {
        try {
            const result = await userManagementApi.rejectUser(userId);
            showToast(result.message, 'success');
            this.refreshTable();
        } catch (error) { 
            showToast(`거절 실패: ${error.message}`, 'error'); 
        }
    }

    
    async deleteUser(userId) {
        try {
            const result = await userManagementApi.deleteUser(userId);
            showToast(result.message, 'success');
            this.refreshTable();
        } catch (error) { 
            showToast(`삭제 실패: ${error.message}`, 'error'); 
        }
    }

    
    async resetPassword(userId) {
        try {
            const result = await userManagementApi.resetPassword(userId);
            showToast(result.message, 'success');
            this.refreshTable();
        } catch (error) { 
            showToast(`비밀번호 초기화 실패: ${error.message}`, 'error'); 
        }
    }

    
    async saveUserPermissions(userId) {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return;
        
        const permissionCheckboxes = container.querySelectorAll(`.permission-checkbox[data-user-id="${userId}"]`);
        let selectedMenuIds = Array.from(permissionCheckboxes).filter(cb => cb.checked).map(cb => cb.dataset.menuId);
        
        try {
            const result = await userManagementApi.savePermissions(userId, selectedMenuIds);
            showToast(result.message, 'success');
            this.refreshTable();
        } catch (error) { 
            showToast(`권한 저장 실패: ${error.message}`, 'error'); 
        }
    }

    
    async saveAllPermissions() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return;
        
        const userRows = container.querySelectorAll('#userTableBody tr');
        const permissionsData = [];

        userRows.forEach(row => {
            const userId = row.querySelector('.permission-checkbox')?.dataset.userId;
            if (userId) {
                const permissionCheckboxes = row.querySelectorAll(`.permission-checkbox[data-user-id="${userId}"]`);
                const selectedMenuIds = Array.from(permissionCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.dataset.menuId);
                permissionsData.push({ user_id: userId, menu_ids: selectedMenuIds });
            }
        });

        if (permissionsData.length === 0) {
            showToast('저장할 데이터가 없습니다.', 'info');
            return;
        }

        try {
            const result = await userManagementApi.saveAllPermissions(permissionsData);
            showToast(result.message, 'success');
            this.refreshTable();
        } catch (error) {
            showToast(`전체 권한 저장 실패: ${error.message}`, 'error');
        }
    }

    
    showBulkUserInputModal() {
        try {
            const modal = document.createElement('div');
            modal.id = 'bulkUserModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">대량 사용자 추가</h3>
                        <span class="close-button" id="closeBulkUserModal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>여러 사용자를 한 번에 추가할 수 있습니다.</p>
                        <p>각 사용자 ID를 줄바꿈(엔터)으로 구분하여 입력하세요.</p>
                        <textarea id="bulkUserInput" class="w-full p-2 border rounded-md shadow-sm" rows="10" placeholder="user001&#10;user002&#10;user003&#10;user004&#10;user005"></textarea>
                        <div class="mt-4 p-3 bg-gray-100 rounded-md">
                            <strong>주의:</strong> 비밀번호는 사용자 ID와 동일하게 초기화됩니다.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="addBulkUsersBtn" class="save">추가</button>
                        <button id="cancelBulkUsersBtn" class="reset">취소</button>
                    </div>
                </div>
            `;


            modal.style.display = 'block';
            modal.style.position = 'fixed';
            modal.style.zIndex = '1050';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.overflow = 'auto';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

            document.body.appendChild(modal);


            const closeBtn = document.getElementById('closeBulkUserModal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
            }

            const cancelBtn = document.getElementById('cancelBulkUsersBtn');
            if (cancelBtn) {
                cancelBtn.className = 'btn btn-secondary';
                cancelBtn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
            }

            const addBtn = document.getElementById('addBulkUsersBtn');
            if (addBtn) {
                addBtn.className = 'btn btn-primary';
                addBtn.addEventListener('click', async () => {
                    const userInput = document.getElementById('bulkUserInput').value;
                    await this.addMultipleUsers(userInput);
                    document.body.removeChild(modal);
                });
            }


            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });

        } catch (error) {
            showToast(`모달 창 생성 실패: ${error.message}`, 'error');
        }
    }

    
    async addMultipleUsers(userInput) {
        if (!userInput || !userInput.trim()) {
            showToast('입력된 사용자 ID가 없습니다.', 'warning');
            return;
        }


        const userIds = userInput.split('\n')
            .map(id => id.trim())
            .filter(id => id.length > 0);

        if (userIds.length === 0) {
            showToast('유효한 사용자 ID가 없습니다.', 'warning');
            return;
        }


        const invalidIds = userIds.filter(id => !isValidUserId(id));

        if (invalidIds.length > 0) {
            showToast(`유효하지 않은 사용자 ID가 포함되어 있습니다: ${invalidIds.join(', ')}. 4-20자 영문, 숫자, 언더스코어만 허용됩니다.`, 'error');
            return;
        }

        try {
            const result = await userManagementApi.addMultipleUsers(userIds);


            const successCount = result.success_count || 0;
            const failedCount = result.failed_count || 0;
            const failedUsers = result.failed_users || [];
            const alreadyExistsCount = result.already_exists_count || 0;
            const alreadyExistsUsers = result.already_exists_users || [];

            let message = `성공적으로 ${successCount}명의 사용자를 추가했습니다.`;

            if (alreadyExistsCount > 0) {
                message += ` (이미 존재하는 사용자: ${alreadyExistsCount}명 - ${alreadyExistsUsers.join(', ')})`;
            }

            if (failedCount > 0) {
                message += ` (기타 오류: ${failedCount}명 - ${failedUsers.join(', ')})`;
            }

            if (alreadyExistsCount > 0 || failedCount > 0) {
                showToast(message, 'warning');
            } else {
                showToast(message, 'success');
            }


            this.refreshTable();

        } catch (error) {
            showToast(`대량 사용자 추가 실패: ${error.message}`, 'error');
        }
    }
}


export const userManagementTab = new UserManagementTab();