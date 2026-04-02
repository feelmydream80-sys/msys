/**
 * API 키 관리 페이지의 데이터 모듈
 */

const ApiKeyMngrData = {
    // API 키 관리 데이터
    apiKeyMngrData: [],

    /**
     * API 키 관리 데이터 로드
     */
    loadApiKeyMngrData: async function() {
        try {
            const response = await axios.get('/api/api_key_mngr');
            
            if (response.status === 200 && response.data.success) {
                this.apiKeyMngrData = response.data.data;
                console.log('API 키 관리 데이터 로드 성공:', this.apiKeyMngrData);
                return true;
            } else {
                console.error('API 키 관리 데이터 로드 실패:', response.data.message);
                return false;
            }
        } catch (error) {
            console.error('API 키 관리 데이터 로드 오류:', error);
            return false;
        }
    },

    /**
     * CD 업데이트
     */
    updateCdFromMngrSett: async function() {
        try {
            const response = await axios.post('/api/api_key_mngr/update_cds');
            
            if (response.status === 200 && response.data.success) {
                console.log('CD 업데이트 성공:', response.data.result);
                // 데이터 다시 로드
                await this.loadApiKeyMngrData();
                return true;
            } else {
                console.error('CD 업데이트 실패:', response.data.message);
                return false;
            }
        } catch (error) {
            console.error('CD 업데이트 오류:', error);
            return false;
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
     */
    getNormalApiKeyMngrData: function() {
        return this.apiKeyMngrData.filter(item => item.api_key && item.days_remaining > 0);
    },

    /**
     * 비정상 상태의 API 키 관리 데이터 반환
     */
    getAbnormalApiKeyMngrData: function() {
        return this.apiKeyMngrData.filter(item => !item.api_key || item.days_remaining <= 0);
    },

    /**
     * 위험군 API 키 관리 데이터 반환 (1개월 이내 만료)
     */
    getRiskApiKeyMngrData: function() {
        return this.apiKeyMngrData.filter(item => item.api_key && item.days_remaining > 0 && item.days_remaining <= 30);
    },

    /**
     * API 키 관리 데이터 업데이트 (API 키 포함)
     */
    updateApiKeyMngr: async function(cd, due, start_dt, api_ownr_email_addr, api_key) {
        try {
            const response = await axios.put(`/api/api_key_mngr/${cd}`, {
                due: due,
                start_dt: start_dt,
                api_ownr_email_addr: api_ownr_email_addr,
                api_key: api_key
            });
            
            if (response.status === 200 && response.data.success) {
                console.log('API 키 관리 데이터 업데이트 성공');
                // 데이터 다시 로드
                await this.loadApiKeyMngrData();
                return true;
            } else {
                console.error('API 키 관리 데이터 업데이트 실패:', response.data.message);
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
            const response = await axios.post('/api/api_key_mngr/send_email', {
                cds: cds
            });
            
            if (response.status === 200 && response.data.success) {
                console.log('메일 발송 성공:', response.data.results);
                return response.data;
            } else {
                console.error('메일 발송 실패:', response.data.message);
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('메일 발송 오류:', error);
            return { success: false, message: error.message };
        }
    }
};
