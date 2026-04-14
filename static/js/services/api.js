// @DOC_FILE: api.js
// @DOC_DESC: 중앙 집중식 API 서비스

/**
 * 중앙 집중식 API 서비스 클래스
 */
class ApiService {
    /**
     * GET 요청
     * @param {string} endpoint - API 엔드포인트
     * @returns {Promise<any>} - 응답 데이터
     */
    static async get(endpoint) {
        try {
            const response = await fetch(`/api/${endpoint}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API 호출 실패:', endpoint, error);
            throw error;
        }
    }

    /**
     * POST 요청
     * @param {string} endpoint - API 엔드포인트
     * @param {any} data - 전송할 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    static async post(endpoint, data) {
        try {
            const response = await fetch(`/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API 호출 실패:', endpoint, error);
            throw error;
        }
    }

    /**
     * DELETE 요청
     * @param {string} endpoint - API 엔드포인트
     * @returns {Promise<any>} - 응답 데이터
     */
    static async delete(endpoint) {
        try {
            const response = await fetch(`/api/${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API 호출 실패:', endpoint, error);
            throw error;
        }
    }
}

// 통계 탭에서 사용할 전용 API 함수들
export const statisticsApi = {
    /**
     * 통계 설정 가져오기
     * @returns {Promise<any>} - 통계 설정 데이터
     */
    async getConfig() {
        return await ApiService.get('statistics/config');
    },

    /**
     * 통계 데이터 가져오기
     * @param {string} viewType - 뷰 타입 (daily, weekly_monthly, comparison)
     * @param {object} params - 파라미터
     * @returns {Promise<any>} - 통계 데이터
     */
    async getData(viewType, params) {
        const queryString = new URLSearchParams({ view_type: viewType, ...params }).toString();
        return await ApiService.get(`statistics?${queryString}`);
    },

    /**
     * 엑셀 다운로드
     * @param {string} viewType - 뷰 타입
     * @param {object} params - 파라미터
     * @returns {Promise<any>} - 엑셀 데이터
     */
    async downloadExcel(viewType, params) {
        const queryString = new URLSearchParams({ view_type: viewType, ...params }).toString();
        return await ApiService.get(`statistics/download?${queryString}`);
    }
};

// 사용자 관리 탭에서 사용할 전용 API 함수들
export const userManagementApi = {
    /**
     * 사용자 목록 가져오기
     * @param {string} searchTerm - 검색어
     * @returns {Promise<any>} - 사용자 목록 데이터
     */
    async getUsers(searchTerm = '') {
        const queryString = searchTerm ? `?search_term=${encodeURIComponent(searchTerm)}` : '';
        return await ApiService.get(`mngr_sett/users${queryString}`);
    },

    /**
     * 사용자 승인
     * @param {string} userId - 사용자 ID
     * @returns {Promise<any>} - 응답 데이터
     */
    async approveUser(userId) {
        return await ApiService.post('mngr_sett/users/approve', { user_id: userId });
    },

    /**
     * 사용자 거절
     * @param {string} userId - 사용자 ID
     * @returns {Promise<any>} - 응답 데이터
     */
    async rejectUser(userId) {
        return await ApiService.post('mngr_sett/users/reject', { user_id: userId });
    },

    /**
     * 사용자 삭제
     * @param {string} userId - 사용자 ID
     * @returns {Promise<any>} - 응답 데이터
     */
    async deleteUser(userId) {
        return await ApiService.post('mngr_sett/users/delete', { user_id: userId });
    },

    /**
     * 비밀번호 초기화
     * @param {string} userId - 사용자 ID
     * @returns {Promise<any>} - 응답 데이터
     */
    async resetPassword(userId) {
        return await ApiService.post('mngr_sett/users/reset-password', { user_id: userId });
    },

    /**
     * 사용자 권한 저장
     * @param {string} userId - 사용자 ID
     * @param {Array<string>} menuIds - 메뉴 ID 목록
     * @returns {Promise<any>} - 응답 데이터
     */
    async savePermissions(userId, menuIds) {
        return await ApiService.post('mngr_sett/users/permissions', { user_id: userId, menu_ids: menuIds });
    },

    /**
     * 전체 사용자 권한 저장
     * @param {Array<object>} permissionsData - 권한 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    async saveAllPermissions(permissionsData) {
        return await ApiService.post('mngr_sett/users/permissions/bulk', { permissions: permissionsData });
    },

    /**
     * 대량 사용자 추가
     * @param {Array<string>} userIds - 사용자 ID 목록
     * @returns {Promise<any>} - 응답 데이터
     */
    async addMultipleUsers(userIds) {
        return await ApiService.post('mngr_sett/users/bulk-add', { user_ids: userIds });
    }
};

// 데이터 접근 권한 탭에서 사용할 전용 API 함수들
export const dataAccessApi = {
    /**
     * 데이터 접근 사용자 목록 가져오기
     * @param {string} searchTerm - 검색어
     * @returns {Promise<any>} - 사용자 목록 데이터
     */
    async getUsers(searchTerm = '') {
        const queryString = searchTerm ? `?search_term=${encodeURIComponent(searchTerm)}` : '';
        return await ApiService.get(`mngr_sett/data_permission/users${queryString}`);
    },

    /**
     * 사용자의 Job 목록 가져오기
     * @param {string} userId - 사용자 ID
     * @returns {Promise<any>} - Job 목록 데이터
     */
    async getJobs(userId) {
        return await ApiService.get(`mngr_sett/data_permission/jobs?user_id=${userId}`);
    },

    /**
     * 데이터 접근 권한 저장
     * @param {string} userId - 사용자 ID
     * @param {Array<string>} jobIds - Job ID 목록
     * @returns {Promise<any>} - 응답 데이터
     */
    async savePermissions(userId, jobIds) {
        return await ApiService.post('mngr_sett/data_permission/save', { user_id: userId, job_ids: jobIds });
    }
};

// 스케줄 설정 탭에서 사용할 전용 API 함수들
export const scheduleSettingsApi = {
    /**
     * 스케줄 설정 가져오기
     * @returns {Promise<any>} - 스케줄 설정 데이터
     */
    async getSettings() {
        return await ApiService.get('mngr_sett/schedule_settings');
    },

    /**
     * 스케줄 설정 저장
     * @param {object} settingsData - 설정 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    async saveSettings(settingsData) {
        return await ApiService.post('mngr_sett/schedule_settings/save', settingsData);
    }
};

// 데이터정의 탭에서 사용할 전용 API 함수들
export const dataDefinitionApi = {
    /**
     * 전체 데이터 목록 가져오기
     * @returns {Promise<any>} - 전체 데이터 목록
     */
    async getDataGroups() {
        return await ApiService.get('data_definition/groups');
    },

    /**
     * 데이터 생성
     * @param {object} data - 생성할 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    async createData(data) {
        return await ApiService.post('data_definition/create', data);
    },

    /**
     * 관리자 설정 데이터 생성
     * @param {string} cd - 생성할 데이터의 CD
     * @returns {Promise<any>} - 응답 데이터
     */
    async createMngrSett(cd) {
        return await ApiService.post('data_definition/create_mngr_sett', { cd });
    },

    /**
     * 데이터 수정
     * @param {string} cdCl - CD_CL
     * @param {string} cd - CD
     * @param {object} data - 수정할 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    async updateData(cdCl, cd, data) {
        return await ApiService.post(`data_definition/update/${cdCl}/${cd}`, data);
    },

    /**
     * 데이터 삭제
     * @param {string} cdCl - CD_CL
     * @param {string} cd - CD
     * @returns {Promise<any>} - 응답 데이터
     */
    async deleteData(cdCl, cd) {
        return await ApiService.delete(`data_definition/delete/${cdCl}/${cd}`);
    }
};

// 엑셀 템플릿 관리에서 사용할 전용 API 함수들
export const excelTemplateApi = {
    /**
     * 엑셀 템플릿 정보 가져오기
     * @returns {Promise<any>} - 템플릿 정보
     */
    async getInfo() {
        return await ApiService.get('excel_template/info');
    },

    /**
     * 엑셀 템플릿 업로드
     * @param {FormData} formData - 파일 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    async upload(formData) {
        // 파일 업로드는 특별한 처리가 필요함
        try {
            const response = await fetch('/api/excel_template/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('엑셀 템플릿 업로드 실패:', error);
            throw error;
        }
    },

    /**
     * 엑셀 템플릿 다운로드
     * @returns {Promise<any>} - 템플릿 데이터
     */
    async download() {
        return await ApiService.get('excel_template/download');
    },

    /**
     * 엑셀 템플릿 삭제
     * @returns {Promise<any>} - 응답 데이터
     */
    async delete() {
        return await ApiService.delete('excel_template/delete');
    }
};

// 팝업 관리 탭에서 사용할 전용 API 함수들
export const popupManagementApi = {
    /**
     * 팝업 목록 가져오기
     * @param {string} searchTerm - 검색어
     * @param {number} page - 페이지 번호
     * @param {number} perPage - 페이지당 항목 수
     * @returns {Promise<any>} - 팝업 목록 데이터
     */
    async getPopups(searchTerm = '', page = 1, perPage = 10) {
        const queryString = new URLSearchParams({ 
            search_term: searchTerm,
            page: page.toString(),
            per_page: perPage.toString()
        }).toString();
        return await ApiService.get(`popups?${queryString}`);
    },

    /**
     * 단일 팝업 가져오기
     * @param {number|string} popupId - 팝업 ID
     * @returns {Promise<any>} - 팝업 데이터
     */
    async getPopup(popupId) {
        return await ApiService.get(`popups/${popupId}`);
    },

    /**
     * 팝업 생성
     * @param {FormData} formData - 팝업 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    async createPopup(formData) {
        try {
            const response = await fetch('/api/popups', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('팝업 생성 실패:', error);
            throw error;
        }
    },

    /**
     * 팝업 수정
     * @param {number|string} popupId - 팝업 ID
     * @param {FormData} formData - 팝업 데이터
     * @returns {Promise<any>} - 응답 데이터
     */
    async updatePopup(popupId, formData) {
        try {
            const response = await fetch(`/api/popups/${popupId}`, {
                method: 'PUT',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('팝업 수정 실패:', error);
            throw error;
        }
    },

    /**
     * 팝업 삭제
     * @param {number|string} popupId - 팝업 ID
     * @returns {Promise<any>} - 응답 데이터
     */
    async deletePopup(popupId) {
        return await ApiService.delete(`popups/${popupId}`);
    }
};