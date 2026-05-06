


import { dataAccessApi } from '../services/api.js';
import { showToast } from '../utils.js';


class DataAccessTab {
    
    constructor() {

        this.elements = {
            tab: null,
            userSearchInput: null,
            userSearchBtn: null,
            userTableBody: null,
            modal: null,
            modalUserId: null,
            closeModalBtn: null,
            unassignedJobsList: null,
            assignedJobsList: null,
            addJobBtn: null,
            addAllJobsBtn: null,
            removeJobBtn: null,
            removeAllJobsBtn: null,
            saveChangesBtn: null,
            unassignedJobSearchInput: null
        };
        

        this.currentUserId = null;
        

        this.debounceTimer = null;
        

        this.lastSelectedItem = null;
        

        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.totalUsers = 0;
    }

    
    initElements() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return false;


        this.elements.userSearchInput = container.querySelector('#dataUserSearchInput');
        this.elements.userSearchBtn = container.querySelector('#dataUserSearchBtn');
        this.elements.userTableBody = container.querySelector('#dataPermissionUserTableBody');
        

        this.elements.tab = container.querySelector('button[data-tab="dataAccessPermission"]');
        

        this.elements.modal = document.querySelector('#dataPermissionModal');
        this.elements.modalUserId = document.querySelector('#dataPermissionModalTitle');
        this.elements.closeModalBtn = document.querySelector('#closePermissionModal');
        this.elements.unassignedJobsList = document.querySelector('#unassignedJobs');
        this.elements.assignedJobsList = document.querySelector('#assignedJobs');
        this.elements.addJobBtn = document.querySelector('#addJobPermission');
        this.elements.addAllJobsBtn = document.querySelector('#addAllJobPermissions');
        this.elements.removeJobBtn = document.querySelector('#removeJobPermission');
        this.elements.removeAllJobsBtn = document.querySelector('#removeAllJobPermissions');
        this.elements.saveChangesBtn = document.querySelector('#savePermissionChangesBtn');
        this.elements.unassignedJobSearchInput = document.querySelector('#unassignedJobSearchInput');

        return true;
    }

    
    initEventListeners() {

        if (this.elements.tab) {
            this.elements.tab.addEventListener('click', () => this.loadUsers());
        }


        if (this.elements.userSearchInput) {
            this.elements.userSearchInput.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.loadUsers(this.elements.userSearchInput.value);
                }, 300);
            });
        }


        if (this.elements.closeModalBtn) {
            this.elements.closeModalBtn.addEventListener('click', () => {
                if (this.elements.modal) {
                    this.elements.modal.style.display = 'none';
                }
            });
        }
        

        window.addEventListener('click', (event) => {
            if (this.elements.modal && event.target == this.elements.modal) {
                this.elements.modal.style.display = 'none';
            }
        });


        if (this.elements.saveChangesBtn) {
            this.elements.saveChangesBtn.addEventListener('click', () => this.savePermissions());
        }
        

        if (this.elements.addJobBtn) {
            this.elements.addJobBtn.addEventListener('click', () => 
                this.moveSelectedItems(this.elements.unassignedJobsList, this.elements.assignedJobsList));
        }
        if (this.elements.addAllJobsBtn) {
            this.elements.addAllJobsBtn.addEventListener('click', () => 
                this.moveAllItems(this.elements.unassignedJobsList, this.elements.assignedJobsList));
        }
        if (this.elements.removeJobBtn) {
            this.elements.removeJobBtn.addEventListener('click', () => 
                this.moveSelectedItems(this.elements.assignedJobsList, this.elements.unassignedJobsList));
        }
        if (this.elements.removeAllJobsBtn) {
            this.elements.removeAllJobsBtn.addEventListener('click', () => 
                this.moveAllItems(this.elements.assignedJobsList, this.elements.unassignedJobsList));
        }


        [this.elements.unassignedJobsList, this.elements.assignedJobsList].forEach(list => {
            if(list) {
                list.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'LI') return;

                    const items = Array.from(list.children);
                    const currentItem = e.target;

                    if (e.shiftKey && this.lastSelectedItem) {
                        const start = items.indexOf(this.lastSelectedItem);
                        const end = items.indexOf(currentItem);
                        
                        items.forEach(item => item.classList.remove('selected'));
                        
                        const range = (start < end) ? items.slice(start, end + 1) : items.slice(end, start + 1);
                        range.forEach(item => item.classList.add('selected'));

                    } else if (e.ctrlKey || e.metaKey) {
                        currentItem.classList.toggle('selected');
                        this.lastSelectedItem = currentItem;
                    } else {
                        items.forEach(item => item.classList.remove('selected'));
                        currentItem.classList.add('selected');
                        this.lastSelectedItem = currentItem;
                    }
                });
            }
        });


        if (this.elements.unassignedJobSearchInput) {
            this.elements.unassignedJobSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const items = this.elements.unassignedJobsList.querySelectorAll('li');
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    }

    
    async loadUsers(searchTerm = '') {
        try {
            const users = await dataAccessApi.getUsers(searchTerm);
            this.renderUserTable(users);
        } catch (error) {
            showToast(error.message, 'error');
            if (this.elements.userTableBody) {
                this.elements.userTableBody.innerHTML = `<tr><td colspan="4" class="text-center">${error.message}</td></tr>`;
            }
        }
    }

    
    renderUserTable(users) {




        if (users && users.length > 0) {
            const firstUser = users[0];






        }


        
        const tableBody = this.elements.userTableBody;
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">사용자가 없습니다.</td></tr>';
            return;
        }
        


        const filteredUsers = users
            .filter(user => (user.status || user.acc_sts) !== 'PENDING')
            .sort((a, b) => {
                const dateA = new Date(b.created_at || b.acc_cre_dt || 0);
                const dateB = new Date(a.created_at || a.acc_cre_dt || 0);
                return dateA - dateB;
            });
        

        this.totalUsers = filteredUsers.length;
        this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pagedUsers = filteredUsers.slice(startIndex, endIndex);
        
        pagedUsers.forEach(user => {
            const row = tableBody.insertRow();
            const allowedJobs = user.job_ids && user.job_ids.length > 0 ? user.job_ids.join(', ') : '없음';

            const userStatus = user.status || user.acc_sts || 'UNKNOWN';
            row.innerHTML = `
                <td>${user.user_id}</td>
                <td>${userStatus}</td>
                <td class="allowed-jobs">${allowedJobs}</td>
                <td><button class="manage-permission-btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs" data-user-id="${user.user_id}">권한 관리</button></td>
            `;
        });
        

        tableBody.querySelectorAll('.manage-permission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.openPermissionModal(e.target.dataset.userId));
        });


        this.renderPagination();
    }

    
    renderPagination() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return;


        const existingPagination = container.querySelector('#dataAccessPagination');
        if (existingPagination) {
            existingPagination.remove();
        }


        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'dataAccessPagination';
        paginationContainer.className = 'flex justify-center items-center gap-2 mt-4';


        const prevBtn = document.createElement('button');
        prevBtn.textContent = '이전';
        prevBtn.className = 'btn';
        prevBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadUsers(this.elements.userSearchInput.value);
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
                this.loadUsers(this.elements.userSearchInput.value);
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
                this.loadUsers(this.elements.userSearchInput.value);
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
            this.loadUsers(this.elements.userSearchInput.value);
        });

        paginationContainer.appendChild(itemsPerPageSelect);
        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageNumbersContainer);
        paginationContainer.appendChild(nextBtn);


        const dataAccessTable = container.querySelector('#dataPermissionUserTableBody').parentElement.parentElement;
        if (dataAccessTable) {
            dataAccessTable.parentNode.appendChild(paginationContainer);
        }
    }

    
    async openPermissionModal(userId) {
        this.currentUserId = userId;
        
        if (!this.elements.modalUserId) {
            return;
        }
        this.elements.modalUserId.textContent = userId;

        try {
            const data = await dataAccessApi.getJobs(userId);

            this.populatePermissionLists(data.all_jobs, data.allowed_job_ids);
            
            if (this.elements.modal) {
                this.elements.modal.style.display = 'block';
            }

        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    
    populatePermissionLists(allJobs, allowedJobIds = []) {
        const unassignedList = this.elements.unassignedJobsList;
        const assignedList = this.elements.assignedJobsList;
        
        if (!unassignedList || !assignedList) return;
        
        unassignedList.innerHTML = '';
        assignedList.innerHTML = '';

        const allowedSet = new Set(allowedJobIds);
        const allJobsMap = new Map(allJobs.map(job => [job.cd, job]));


        const sortedJobs = allJobs.slice().sort((a, b) => {
            const aNum = parseInt(a.cd.replace('CD', ''));
            const bNum = parseInt(b.cd.replace('CD', ''));
            return aNum - bNum;
        });

        sortedJobs.forEach(job => {

            if (job.cd.endsWith('00')) return;

            const li = document.createElement('li');
            li.textContent = `${job.cd}: ${job.cd_nm}`;
            li.dataset.id = job.cd;
            if (allowedSet.has(job.cd)) {
                assignedList.appendChild(li);
            } else {
                unassignedList.appendChild(li);
            }
        });
    }

    
    moveSelectedItems(fromList, toList) {
        const selectedItems = Array.from(fromList.querySelectorAll('li.selected'));
        selectedItems.forEach(item => {
            item.classList.remove('selected');
            toList.appendChild(item);
        });
    }

    
    moveAllItems(fromList, toList) {
        const allItems = Array.from(fromList.querySelectorAll('li'));
        allItems.forEach(item => {
            item.classList.remove('selected');
            toList.appendChild(item);
        });
    }

    
    async savePermissions() {
        if (!this.currentUserId) return;

        const allowedJobIds = Array.from(this.elements.assignedJobsList.querySelectorAll('li')).map(li => li.dataset.id);

        try {
            const result = await dataAccessApi.savePermissions(this.currentUserId, allowedJobIds);
            
            showToast('데이터 접근 권한이 성공적으로 저장되었습니다.', 'success');
            
            if (this.elements.modal) {
                this.elements.modal.style.display = 'none';
            }
            

            this.loadUsers(this.elements.userSearchInput.value);

        } catch (error) {

            showToast(`저장 실패: ${error.message}`, 'error');
        }
    }
}


export const dataAccessTab = new DataAccessTab();