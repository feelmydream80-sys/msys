



class ApiService {
    
    static async get(endpoint) {
        try {
            const response = await fetch(`/api/${endpoint}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {

            throw error;
        }
    }

    
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

            throw error;
        }
    }

    
    static async delete(endpoint) {
        try {
            const response = await fetch(`/api/${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {

            throw error;
        }
    }
}


export const statisticsApi = {
    
    async getConfig() {
        return await ApiService.get('statistics/config');
    },

    
    async getData(viewType, params) {
        const queryString = new URLSearchParams({ view_type: viewType, ...params }).toString();
        return await ApiService.get(`statistics?${queryString}`);
    },

    
    async downloadExcel(viewType, params) {
        const queryString = new URLSearchParams({ view_type: viewType, ...params }).toString();
        return await ApiService.get(`statistics/download?${queryString}`);
    }
};


export const userManagementApi = {
    
    async getUsers(searchTerm = '') {
        const queryString = searchTerm ? `?search_term=${encodeURIComponent(searchTerm)}` : '';
        return await ApiService.get(`mngr_sett/users${queryString}`);
    },

    
    async approveUser(userId) {
        return await ApiService.post('mngr_sett/users/approve', { user_id: userId });
    },

    
    async rejectUser(userId) {
        return await ApiService.post('mngr_sett/users/reject', { user_id: userId });
    },

    
    async deleteUser(userId) {
        return await ApiService.post('mngr_sett/users/delete', { user_id: userId });
    },

    
    async resetPassword(userId) {
        return await ApiService.post('mngr_sett/users/reset-password', { user_id: userId });
    },

    
    async savePermissions(userId, menuIds) {
        return await ApiService.post('mngr_sett/users/permissions', { user_id: userId, menu_ids: menuIds });
    },

    
    async saveAllPermissions(permissionsData) {
        return await ApiService.post('mngr_sett/users/permissions/bulk', { permissions: permissionsData });
    },

    
    async addMultipleUsers(userIds) {
        return await ApiService.post('mngr_sett/users/bulk-add', { user_ids: userIds });
    }
};


export const dataAccessApi = {
    
    async getUsers(searchTerm = '') {
        const queryString = searchTerm ? `?search_term=${encodeURIComponent(searchTerm)}` : '';
        return await ApiService.get(`mngr_sett/data_permission/users${queryString}`);
    },

    
    async getJobs(userId) {
        return await ApiService.get(`mngr_sett/data_permission/jobs?user_id=${userId}`);
    },

    
    async savePermissions(userId, jobIds) {
        return await ApiService.post('mngr_sett/data_permission/save', { user_id: userId, job_ids: jobIds });
    }
};


export const scheduleSettingsApi = {
    
    async getSettings() {
        return await ApiService.get('mngr_sett/schedule_settings');
    },

    
    async saveSettings(settingsData) {
        return await ApiService.post('mngr_sett/schedule_settings/save', settingsData);
    }
};


export const dataDefinitionApi = {
    
    async getDataGroups() {
        return await ApiService.get('data_definition/groups');
    },

    
    async createData(data) {
        return await ApiService.post('data_definition/create', data);
    },

    
    async createMngrSett(cd) {
        return await ApiService.post('data_definition/create_mngr_sett', { cd });
    },

    
    async updateData(cdCl, cd, data) {
        return await ApiService.post(`data_definition/update/${cdCl}/${cd}`, data);
    },

    
    async deleteData(cdCl, cd) {
        return await ApiService.delete(`data_definition/delete/${cdCl}/${cd}`);
    }
};


export const excelTemplateApi = {
    
    async getInfo() {
        return await ApiService.get('excel_template/info');
    },

    
    async upload(formData) {

        try {
            const response = await fetch('/api/excel_template/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {

            throw error;
        }
    },

    
    async download() {
        return await ApiService.get('excel_template/download');
    },

    
    async delete() {
        return await ApiService.delete('excel_template/delete');
    }
};


export const popupManagementApi = {
    
    async getPopups(searchTerm = '', page = 1, perPage = 10) {
        const queryString = new URLSearchParams({ 
            search_term: searchTerm,
            page: page.toString(),
            per_page: perPage.toString()
        }).toString();
        return await ApiService.get(`popups?${queryString}`);
    },

    
    async getPopup(popupId) {
        return await ApiService.get(`popups/${popupId}`);
    },

    
    async createPopup(formData) {
        try {
            const response = await fetch('/api/popups', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {

            throw error;
        }
    },

    
    async updatePopup(popupId, formData) {
        try {
            const response = await fetch(`/api/popups/${popupId}`, {
                method: 'PUT',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {

            throw error;
        }
    },

    
    async deletePopup(popupId) {
        return await ApiService.delete(`popups/${popupId}`);
    }
};