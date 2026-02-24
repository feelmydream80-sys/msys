// @DOC_FILE: dataAccess.js
// @DOC_DESC: 데이터 접근 권한 탭 모듈

import { dataAccessApi } from '../services/api.js';
import { showToast } from '../utils.js';

/**
 * 데이터 접근 권한 탭 클래스
 */
class DataAccessTab {
    /**
     * 생성자
     */
    constructor() {
        // DOM 요소들
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
        
        // 현재 선택된 사용자 ID
        this.currentUserId = null;
        
        // 디바운스 타이머
        this.debounceTimer = null;
        
        // 마지막 선택된 항목
        this.lastSelectedItem = null;
    }

    /**
     * DOM 요소 초기화
     * @returns {boolean} - 초기화 성공 여부
     */
    initElements() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return false;

        // 메인 컨테이너 내 요소들
        this.elements.userSearchInput = container.querySelector('#dataUserSearchInput');
        this.elements.userSearchBtn = container.querySelector('#dataUserSearchBtn');
        this.elements.userTableBody = container.querySelector('#dataPermissionUserTableBody');
        
        // 탭 버튼
        this.elements.tab = container.querySelector('button[data-tab="dataAccessPermission"]');
        
        // 모달 관련 요소들 (전체 문서에서 선택)
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

    /**
     * 이벤트 리스너 등록
     */
    initEventListeners() {
        // 탭 클릭 이벤트
        if (this.elements.tab) {
            this.elements.tab.addEventListener('click', () => this.loadUsers());
        }

        // 사용자 검색 이벤트
        if (this.elements.userSearchInput) {
            this.elements.userSearchInput.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.loadUsers(this.elements.userSearchInput.value);
                }, 300); // 300ms 디바운스
            });
        }

        // 모달 닫기 이벤트
        if (this.elements.closeModalBtn) {
            this.elements.closeModalBtn.addEventListener('click', () => {
                if (this.elements.modal) {
                    this.elements.modal.style.display = 'none';
                }
            });
        }
        
        // 모달 외부 클릭 시 닫기
        window.addEventListener('click', (event) => {
            if (this.elements.modal && event.target == this.elements.modal) {
                this.elements.modal.style.display = 'none';
            }
        });

        // 권한 저장 버튼 이벤트
        if (this.elements.saveChangesBtn) {
            this.elements.saveChangesBtn.addEventListener('click', () => this.savePermissions());
        }
        
        // 권한 이동 버튼 이벤트
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

        // 리스트 항목 선택 이벤트 (다중 선택 지원)
        [this.elements.unassignedJobsList, this.elements.assignedJobsList].forEach(list => {
            if(list) {
                list.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'LI') return;

                    const items = Array.from(list.children);
                    const currentItem = e.target;

                    if (e.shiftKey && this.lastSelectedItem) {
                        const start = items.indexOf(this.lastSelectedItem);
                        const end = items.indexOf(currentItem);
                        
                        items.forEach(item => item.classList.remove('selected')); // 이전 선택 해제
                        
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

        // 미할당 작업 검색 이벤트
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

    /**
     * 데이터 접근 사용자 목록 로드
     * @param {string} searchTerm - 검색어
     */
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

    /**
     * 사용자 테이블 렌더링
     * @param {Array<object>} users - 사용자 목록
     */
    renderUserTable(users) {
        const tableBody = this.elements.userTableBody;
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">사용자가 없습니다.</td></tr>';
            return;
        }
        
        // PENDING 상태 사용자를 제외하고 가입일 최신순으로 정렬
        users
            .filter(user => user.status !== 'PENDING')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .forEach(user => {
                const row = tableBody.insertRow();
                const allowedJobs = user.job_ids && user.job_ids.length > 0 ? user.job_ids.join(', ') : '없음';
                row.innerHTML = `
                    <td>${user.user_id}</td>
                    <td>${user.status}</td>
                    <td class="allowed-jobs">${allowedJobs}</td>
                    <td><button class="manage-permission-btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs" data-user-id="${user.user_id}">권한 관리</button></td>
                `;
            });
        
        // 권한 관리 버튼 이벤트 리스너 추가
        tableBody.querySelectorAll('.manage-permission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.openPermissionModal(e.target.dataset.userId));
        });
    }

    /**
     * 권한 관리 모달 열기
     * @param {string} userId - 사용자 ID
     */
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

    /**
     * 권한 목록 채우기
     * @param {Array<object>} allJobs - 전체 작업 목록
     * @param {Array<string>} allowedJobIds - 허용된 작업 ID 목록
     */
    populatePermissionLists(allJobs, allowedJobIds = []) {
        const unassignedList = this.elements.unassignedJobsList;
        const assignedList = this.elements.assignedJobsList;
        
        if (!unassignedList || !assignedList) return;
        
        unassignedList.innerHTML = '';
        assignedList.innerHTML = '';

        const allowedSet = new Set(allowedJobIds);
        const allJobsMap = new Map(allJobs.map(job => [job.cd, job]));

        // Job ID를 숫자 값 기준으로 정렬
        const sortedJobs = allJobs.slice().sort((a, b) => {
            const aNum = parseInt(a.cd.replace('CD', ''));
            const bNum = parseInt(b.cd.replace('CD', ''));
            return aNum - bNum;
        });

        sortedJobs.forEach(job => {
            // 100단위 코드는 목록에 표시하지 않음
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

    /**
     * 선택된 항목 이동
     * @param {HTMLElement} fromList - 출발지 리스트
     * @param {HTMLElement} toList - 목적지 리스트
     */
    moveSelectedItems(fromList, toList) {
        const selectedItems = Array.from(fromList.querySelectorAll('li.selected'));
        selectedItems.forEach(item => {
            item.classList.remove('selected');
            toList.appendChild(item);
        });
    }

    /**
     * 전체 항목 이동
     * @param {HTMLElement} fromList - 출발지 리스트
     * @param {HTMLElement} toList - 목적지 리스트
     */
    moveAllItems(fromList, toList) {
        const allItems = Array.from(fromList.querySelectorAll('li'));
        allItems.forEach(item => {
            item.classList.remove('selected');
            toList.appendChild(item);
        });
    }

    /**
     * 데이터 접근 권한 저장
     */
    async savePermissions() {
        if (!this.currentUserId) return;

        const allowedJobIds = Array.from(this.elements.assignedJobsList.querySelectorAll('li')).map(li => li.dataset.id);

        try {
            const result = await dataAccessApi.savePermissions(this.currentUserId, allowedJobIds);
            
            showToast('데이터 접근 권한이 성공적으로 저장되었습니다.', 'success');
            
            if (this.elements.modal) {
                this.elements.modal.style.display = 'none';
            }
            
            // 사용자 테이블 새로고침
            this.loadUsers(this.elements.userSearchInput.value);

        } catch (error) {
            console.error(error);
            showToast(`저장 실패: ${error.message}`, 'error');
        }
    }
}

// 전역 인스턴스 생성 및 내보내기
export const dataAccessTab = new DataAccessTab();