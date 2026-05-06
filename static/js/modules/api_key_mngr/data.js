


async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

window.ApiKeyMngrData = {

    apiKeyMngrData: [],

    
    loadApiKeyMngrData: async function() {
        try {
            const data = await apiFetch('/api/api_key_mngr');
            
            if (data.success) {
                this.apiKeyMngrData = data.data;
                return true;
            } else {

                return false;
            }
        } catch (error) {

            return false;
        }
    },

    
    loadApiKeyMngrDataPaged: async function(page = 1, pageSize = 10) {
        try {
            const params = new URLSearchParams({
                page: page,
                page_size: pageSize
            });
            const data = await apiFetch(`/api/api_key_mngr/paged?${params}`);
            
            if (data.success) {
                this.apiKeyMngrData = data.data;

                return {
                    success: true,
                    data: data.data,
                    pagination: data.pagination
                };
            } else {

                return { success: false, data: [], pagination: {} };
            }
        } catch (error) {

            return { success: false, data: [], pagination: {} };
        }
    },

    
    loadApiKeyMngrDataPagedWithSearch: async function(page = 1, pageSize = 10, searchQuery = '') {
        try {
            const params = new URLSearchParams({
                page: page,
                page_size: pageSize,
                search: searchQuery
            });
            const data = await apiFetch(`/api/api_key_mngr/paged?${params}`);
            
            if (data.success) {
                this.apiKeyMngrData = data.data;

                return {
                    success: true,
                    data: data.data,
                    pagination: data.pagination
                };
            } else {

                return { success: false, data: [], pagination: {} };
            }
        } catch (error) {

            return { success: false, data: [], pagination: {} };
        }
    },

    
    updateCdFromMngrSett: async function() {
        try {
            const data = await apiFetch('/api/api_key_mngr/update_cds', {
                method: 'POST'
            });
            
            if (data.success) {


                await this.loadApiKeyMngrData();
                return { success: true, added_count: data.added_count || 0 };
            } else {

                return { success: false, message: data.message };
            }
        } catch (error) {

            return { success: false, message: error.message };
        }
    },

    
    getApiKeyMngrData: function() {
        return this.apiKeyMngrData;
    },

    
    getNormalApiKeyMngrData: function() {
        return this.apiKeyMngrData;
    },

    
    getAbnormalApiKeyMngrData: function() {
        return this.apiKeyMngrData.filter(item => !item.api_key || item.days_remaining <= 0);
    },

    
    getRiskApiKeyMngrData: function() {
        return this.apiKeyMngrData.filter(item => item.api_key && item.days_remaining <= 30);
    },

    
    updateApiKeyMngr: async function(cd, due, start_dt, api_ownr_email_addr, api_key) {
        try {
            const data = await apiFetch(`/api/api_key_mngr/${cd}`, {
                method: 'PUT',
                body: JSON.stringify({
                    due: due,
                    start_dt: start_dt,
                    api_ownr_email_addr: api_ownr_email_addr,
                    api_key: api_key
                })
            });
            
            if (data.success) {


                await this.loadApiKeyMngrData();
                return true;
            } else {

                return false;
            }
        } catch (error) {

            return false;
        }
    },

    
    sendEmail: async function(cds) {
        try {
            const data = await apiFetch('/api/api_key_mngr/send_email', {
                method: 'POST',
                body: JSON.stringify({ cds: cds })
            });
            
            if (data.success) {

                return data;
            } else {

                return { success: false, message: data.message };
            }
        } catch (error) {

            return { success: false, message: error.message };
        }
    },





    
    getMailSendHistory: async function(page = 1, pageSize = 50, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page,
                page_size: pageSize,
                ...filters
            });
            const data = await apiFetch(`/api/api_key_mngr/mail_send_history?${params}`);
            
            if (data.success) {
                return data.data;
            } else {

                return { logs: [], pagination: {} };
            }
        } catch (error) {

            return { logs: [], pagination: {} };
        }
    },

    
    sendScheduledMails: async function(targetCds = null, excludeCds = null) {
        try {
            const data = await apiFetch('/api/api_key_mngr/send_scheduled_mails', {
                method: 'POST',
                body: JSON.stringify({
                    target_cds: targetCds,
                    exclude_cds: excludeCds
                })
            });
            
            if (data.success) {

                return data;
            } else {

                return { success: false, message: data.message };
            }
        } catch (error) {

            return { success: false, message: error.message };
        }
    },





    
    getScheduleSettings: async function() {
        try {
            const data = await apiFetch('/api/api_key_mngr/schedule_settings');
            
            if (data.success) {
                return data.settings;
            } else {

                return [];
            }
        } catch (error) {

            return [];
        }
    },

    
    saveScheduleSettings: async function(settings) {
        try {
            const data = await apiFetch('/api/api_key_mngr/schedule_settings', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            
            if (data.success) {

                return true;
            } else {

                return false;
            }
        } catch (error) {

            return false;
        }
    },





    
    getMailStatusForRiskGroup: async function() {
        try {

            const params = new URLSearchParams({
                page: 1,
                page_size: 1000
            });
            const data = await apiFetch(`/api/api_key_mngr/mail_send_history?${params}`);
            
            if (data.success) {
                const logs = data.data.logs || [];
                

                const mailStatusMap = {};
                
                logs.forEach(log => {
                    const cd = log.cd;
                    if (!mailStatusMap[cd]) {
                        mailStatusMap[cd] = {
                            success: [],
                            failed: []
                        };
                    }
                    
                    if (log.success) {
                        mailStatusMap[cd].success.push({
                            sent_dt: log.sent_dt,
                            mail_tp: log.mail_tp,
                            reg_dt: log.reg_dt
                        });
                    } else {
                        mailStatusMap[cd].failed.push({
                            sent_dt: log.sent_dt,
                            mail_tp: log.mail_tp,
                            error_msg: log.error_msg,
                            reg_dt: log.reg_dt
                        });
                    }
                });
                

                Object.keys(mailStatusMap).forEach(cd => {
                    mailStatusMap[cd].success.sort((a, b) => new Date(b.sent_dt) - new Date(a.sent_dt));
                    mailStatusMap[cd].failed.sort((a, b) => new Date(b.sent_dt) - new Date(a.sent_dt));
                });
                
                return mailStatusMap;
            } else {

                return {};
            }
        } catch (error) {

            return {};
        }
    },

    
    getScheduleHourInfo: async function() {
        try {
            const data = await apiFetch('/api/api_key_mngr/schedule_settings');
            
            if (data.success) {
                const settings = data.settings || data.data?.settings || [];
                const hourInfo = {};
                
                settings.forEach(s => {
                    if (s.is_active) {
                        hourInfo[s.schd_tp] = {
                            hour: s.schd_hour,
                            cycle: s.schd_cycle
                        };
                    }
                });
                
                return hourInfo;
            }
            return {};
        } catch (error) {

            return {};
        }
    },

    
    sendTestMail: async function(testEmail) {
        try {
            const data = await apiFetch('/api/api_key_mngr/send_test_mail', {
                method: 'POST',
                body: JSON.stringify({ test_email: testEmail })
            });
            
            if (data.success) {

                return data;
            } else {

                return { success: false, message: data.message };
            }
        } catch (error) {

            return { success: false, message: error.message };
        }
    },





    
    getMailSettingHistory: async function(mailTp, version) {
        try {
            const data = await apiFetch(`/api/api_key_mngr/mail_setting_history?mail_tp=mail${mailTp}&version=${version}`);
            
            if (data.success) {
                return data;
            } else {

                return { success: false, message: data.message };
            }
        } catch (error) {

            return { success: false, message: error.message };
        }
    },

    
    getCurrentMailSetting: async function(mailTp) {
        try {
            const data = await apiFetch(`/api/api_key_mngr/mail_settings`);
            
            if (data.success) {
                const settings = data.settings || {};
                const key = `mail${mailTp}`;
                const setting = settings[key] || {};
                
                return {
                    success: true,
                    data: {
                        subject: setting.subject || '',
                        from_email: setting.from || '',
                        body: setting.body || ''
                    }
                };
            } else {

                return { success: false, message: data.message };
            }
        } catch (error) {

            return { success: false, message: error.message };
        }
    },

    
    getMailSettingHistoryCount: async function(mailTp) {
        try {
            const data = await apiFetch(`/api/api_key_mngr/mail_setting_history_count?mail_tp=mail${mailTp}`);
            
            if (data.success) {
                return data.count || 0;
            }
            return 0;
        } catch (error) {

            return 0;
        }
    },

    
    batchUpdateApiKeyMngr: async function(cds, fields) {
        try {
            const data = await apiFetch('/api/api_key_mngr/batch', {
                method: 'PUT',
                body: JSON.stringify({
                    cds: cds,
                    ...fields
                })
            });
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};
