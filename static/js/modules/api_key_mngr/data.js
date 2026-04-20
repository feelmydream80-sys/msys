/**
 * API 키 관리 페이지의 데이터 모듈
 * axios 대신 fetch API를 사용하여 SPA 라우팅 환경에서도 안정적으로 동작합니다.
 */

// API 응답을 처리하는 헬퍼 함수
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
    // API 키 관리 데이터
    apiKeyMngrData: [],

    /**
     * API 키 관리 데이터 로드
     */
    loadApiKeyMngrData: async function() {
        try {
            const data = await apiFetch('/api/api_key_mngr');
            
            if (data.success) {
                // [파이프라인:API] 로그①: API 응답 데이터 개수 및 샘플
                console.log('[파이프라인:API] 응답 데이터:', data.data.length, '건');
                console.log('[파이프라인:API] 샘플 (첫번째):', data.data[0]);
                
                this.apiKeyMngrData = data.data;
                
                // [파이프라인:저장] 로그②: 저장된 데이터 확인 (cd_cl 존재 여부)
                console.log('[파이프라인:저장] apiKeyMngrData.length:', this.apiKeyMngrData.length);
                console.log('[파이프라인:저장] 첫번째 항목 cd_cl:', this.apiKeyMngrData[0]?.cd_cl);
                console.log('[파이프라인:저장] cd_cl 있는 항목 수:', this.apiKeyMngrData.filter(i => i.cd_cl).length);
                
                return true;
            } else {
                console.error('API 키 관리 데이터 로드 실패:', data.message);
                return false;
            }
        } catch (error) {
            console.error('API 키 관리 데이터 로드 오류:', error);
            return false;
        }
    },

    /**
     * API 키 관리 데이터 로드 (페이징 - 새 함수)
     * @param {number} page - 페이지 번호 (1부터 시작)
     * @param {number} pageSize - 페이지당 데이터 수
     * @returns {object} { success, data, pagination }
     */
    loadApiKeyMngrDataPaged: async function(page = 1, pageSize = 10) {
        try {
            const params = new URLSearchParams({
                page: page,
                page_size: pageSize
            });
            const data = await apiFetch(`/api/api_key_mngr/paged?${params}`);
            
            if (data.success) {
                this.apiKeyMngrData = data.data;
                console.log('API 키 관리 데이터 로드 성공 (페이징):', {
                    data: data.data.length,
                    pagination: data.pagination
                });
                return {
                    success: true,
                    data: data.data,
                    pagination: data.pagination
                };
            } else {
                console.error('API 키 관리 데이터 로드 실패:', data.message);
                return { success: false, data: [], pagination: {} };
            }
        } catch (error) {
            console.error('API 키 관리 데이터 로드 오류:', error);
            return { success: false, data: [], pagination: {} };
        }
    },

    /**
     * API 키 관리 데이터 로드 (검색+페이징 - 새 함수)
     * @param {number} page - 페이지 번호 (1부터 시작)
     * @param {number} pageSize - 페이지당 데이터 수
     * @param {string} searchQuery - 검색어
     * @returns {object} { success, data, pagination }
     */
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
                console.log('API 키 관리 데이터 로드 성공 (검색+페이징):', {
                    data: data.data.length,
                    pagination: data.pagination,
                    search: searchQuery
                });
                return {
                    success: true,
                    data: data.data,
                    pagination: data.pagination
                };
            } else {
                console.error('API 키 관리 데이터 로드 실패:', data.message);
                return { success: false, data: [], pagination: {} };
            }
        } catch (error) {
            console.error('API 키 관리 데이터 로드 오류:', error);
            return { success: false, data: [], pagination: {} };
        }
    },

    /**
     * CD 업데이트 (TB_MNGR_SETT → TB_API_KEY_MNGR)
     */
    updateCdFromMngrSett: async function() {
        try {
            const data = await apiFetch('/api/api_key_mngr/update_cds', {
                method: 'POST'
            });
            
            if (data.success) {
                console.log('CD 업데이트 성공:', data);
                // 데이터 다시 로드
                await this.loadApiKeyMngrData();
                return { success: true, added_count: data.added_count || 0 };
            } else {
                console.error('CD 업데이트 실패:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('CD 업데이트 오류:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * API 키 관리 데이터 반환
     */
    getApiKeyMngrData: function() {
        return this.apiKeyMngrData;
    },

    /**
     * 정상 상태의 API 키 관리 데이터 반환
     * - 모든 데이터를 반환 (필터링은 getFilteredApiKeyMngrData에서 처리)
     */
    getNormalApiKeyMngrData: function() {
        return this.apiKeyMngrData;
    },

    /**
     * 비정상 상태의 API 키 관리 데이터 반환
     * - api_key 값이 없거나 만료된 데이터
     */
    getAbnormalApiKeyMngrData: function() {
        return this.apiKeyMngrData.filter(item => !item.api_key || item.days_remaining <= 0);
    },

    /**
     * 위험군 API 키 관리 데이터 반환 (1개월 이내 만료 + 만료된 키 포함)
     */
    getRiskApiKeyMngrData: function() {
        return this.apiKeyMngrData.filter(item => item.api_key && item.days_remaining <= 30);
    },

    /**
     * 고유한 그룹(cd_cl) 목록 추출
     */
    getUniqueGroups: function() {
        // [파이프라인:추출] 로그④: 추출 시작 및 데이터 순회
        console.log('[파이프라인:추출] getUniqueGroups() 시작');
        console.log('[파이프라인:추출] 전체 데이터 개수:', this.apiKeyMngrData.length);
        
        // 데이터 샘플 출력 (앞 5개)
        const sample = this.apiKeyMngrData.slice(0, 5).map(i => ({cd: i.cd, cd_cl: i.cd_cl}));
        console.log('[파이프라인:추출] 데이터 샘플 (5개):', sample);
        
        const groups = new Set();
        let hasCdClCount = 0;
        let noCdClCount = 0;
        
        this.apiKeyMngrData.forEach(item => {
            if (item.cd_cl) {
                groups.add(item.cd_cl);
                hasCdClCount++;
            } else {
                noCdClCount++;
            }
        });
        
        const result = Array.from(groups).sort();
        
        // [파이프라인:추출] 로그⑤: 추출 결과
        console.log('[파이프라인:추출] cd_cl 있는 항목:', hasCdClCount, 'cd_cl 없는 항목:', noCdClCount);
        console.log('[파이프라인:추출] 추출된 고유 그룹:', result, '(' + result.length + '개)');
        
        return result;
    },

    /**
     * API 키 관리 데이터 업데이트 (API 키 포함)
     */
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
                console.log('API 키 관리 데이터 업데이트 성공');
                // 데이터 다시 로드
                await this.loadApiKeyMngrData();
                return true;
            } else {
                console.error('API 키 관리 데이터 업데이트 실패:', data.message);
                return false;
            }
        } catch (error) {
            console.error('API 키 관리 데이터 업데이트 오류:', error);
            return false;
        }
    },

    /**
     * 알림 메일 전송 (선택된 CD 목록에 대해)
     * Following the same pattern as Airflow's ServiceMonitor.send_emails()
     */
    sendEmail: async function(cds) {
        try {
            const data = await apiFetch('/api/api_key_mngr/send_email', {
                method: 'POST',
                body: JSON.stringify({ cds: cds })
            });
            
            if (data.success) {
                console.log('메일 발송 성공:', data.results);
                return data;
            } else {
                console.error('메일 발송 실패:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('메일 발송 오류:', error);
            return { success: false, message: error.message };
        }
    },

    // ==========================================
    // 메일 전송 이력 관련 (신규 추가)
    // ==========================================

    /**
     * 메일 전송 이력 조회
     */
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
                console.error('메일 전송 이력 조회 실패:', data.message);
                return { logs: [], pagination: {} };
            }
        } catch (error) {
            console.error('메일 전송 이력 조회 오류:', error);
            return { logs: [], pagination: {} };
        }
    },

    /**
     * 스케줄 메일 발송 (수동 실행)
     */
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
                console.log('스케줄 메일 발송 성공:', data.results);
                return data;
            } else {
                console.error('스케줄 메일 발송 실패:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('스케줄 메일 발송 오류:', error);
            return { success: false, message: error.message };
        }
    },

    // ==========================================
    // 스케줄 설정 관련 (신규 추가)
    // ==========================================

    /**
     * 스케줄 설정 조회
     */
    getScheduleSettings: async function() {
        try {
            const data = await apiFetch('/api/api_key_mngr/schedule_settings');
            
            if (data.success) {
                return data.settings;
            } else {
                console.error('스케줄 설정 조회 실패:', data.message);
                return [];
            }
        } catch (error) {
            console.error('스케줄 설정 조회 오류:', error);
            return [];
        }
    },

    /**
     * 스케줄 설정 저장
     */
    saveScheduleSettings: async function(settings) {
        try {
            const data = await apiFetch('/api/api_key_mngr/schedule_settings', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            
            if (data.success) {
                console.log('스케줄 설정 저장 성공');
                return true;
            } else {
                console.error('스케줄 설정 저장 실패:', data.message);
                return false;
            }
        } catch (error) {
            console.error('스케줄 설정 저장 오류:', error);
            return false;
        }
    },

    // ==========================================
    // 위험군 메일 전송 상태 관련 (신규 추가)
    // ==========================================

    /**
     * 위험군용 메일 전송 이력 조회 (CD별 최신 성공 이력)
     */
    getMailStatusForRiskGroup: async function() {
        try {
            // 모든 메일 전송 이력 조회 (페이지 크기 크게)
            const params = new URLSearchParams({
                page: 1,
                page_size: 1000
            });
            const data = await apiFetch(`/api/api_key_mngr/mail_send_history?${params}`);
            
            if (data.success) {
                const logs = data.data.logs || [];
                
                // CD별로 그룹화하여 최신 성공 이력만 추출
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
                
                // 날짜 기준으로 정렬 (최신순)
                Object.keys(mailStatusMap).forEach(cd => {
                    mailStatusMap[cd].success.sort((a, b) => new Date(b.sent_dt) - new Date(a.sent_dt));
                    mailStatusMap[cd].failed.sort((a, b) => new Date(b.sent_dt) - new Date(a.sent_dt));
                });
                
                return mailStatusMap;
            } else {
                console.error('메일 전송 이력 조회 실패:', data.message);
                return {};
            }
        } catch (error) {
            console.error('메일 전송 이력 조회 오류:', error);
            return {};
        }
    },

    /**
     * 스케줄 설정 조회 (시간 정보 포함)
     */
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
            console.error('스케줄 설정 조회 오류:', error);
            return {};
        }
    },

    /**
     * 테스트 메일 발송
     */
    sendTestMail: async function(testEmail) {
        try {
            const data = await apiFetch('/api/api_key_mngr/send_test_mail', {
                method: 'POST',
                body: JSON.stringify({ test_email: testEmail })
            });
            
            if (data.success) {
                console.log('테스트 메일 발송 성공:', data.message);
                return data;
            } else {
                console.error('테스트 메일 발송 실패:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('테스트 메일 발송 오류:', error);
            return { success: false, message: error.message };
        }
    },

    // ==========================================
    // 메일 설정 이력 관련 (신규 추가)
    // ==========================================

    /**
     * 메일 설정 이력 조회 (과거 버전)
     * @param {string} mailTp - 메일 유형 ('30', '7', '0')
     * @param {number} version - 버전 번호 (1=최신에서 3번째 전, 2=2번째 전, 3=3번째 전)
     */
    getMailSettingHistory: async function(mailTp, version) {
        try {
            const data = await apiFetch(`/api/api_key_mngr/mail_setting_history?mail_tp=mail${mailTp}&version=${version}`);
            
            if (data.success) {
                return data;
            } else {
                console.error('메일 설정 이력 조회 실패:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('메일 설정 이력 조회 오류:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * 현재 메일 설정 조회
     * @param {string} mailTp - 메일 유형 ('30', '7', '0')
     */
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
                console.error('현재 메일 설정 조회 실패:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('현재 메일 설정 조회 오류:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * 메일 설정 이력 개수 조회
     * @param {string} mailTp - 메일 유형 ('30', '7', '0')
     * @returns {number} 이력 개수
     */
    getMailSettingHistoryCount: async function(mailTp) {
        try {
            const data = await apiFetch(`/api/api_key_mngr/mail_setting_history_count?mail_tp=mail${mailTp}`);
            
            if (data.success) {
                return data.count || 0;
            }
            return 0;
        } catch (error) {
            console.error('메일 설정 이력 개수 조회 오류:', error);
            return 0;
        }
    }
};
