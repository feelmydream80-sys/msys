


import { statisticsApi } from './api.js';
import { userManagementApi } from './api.js';
import { dataAccessApi } from './api.js';
import { scheduleSettingsApi } from './api.js';
import { excelTemplateApi } from './api.js';


class StateManager {
    
    constructor() {

        this.state = {
            icons: [],
            users: [],
            menus: [],
            settings: [],
            scheduleSettings: null,
            excelTemplateInfo: null
        };
        

        this.listeners = {};
    }

    
    setState(key, value) {
        this.state[key] = value;
        this.notifyListeners(key);
    }

    
    getState(key) {
        return this.state[key];
    }

    
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

    
    notifyListeners(key) {
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => callback(this.state[key]));
        }
    }

    
    async loadInitialData() {
        try {

            const iconsResponse = await statisticsApi.getConfig();
            this.setState('icons', iconsResponse.icons || []);


            const usersResponse = await userManagementApi.getUsers();
            this.setState('users', usersResponse.users || []);
            this.setState('menus', usersResponse.menus || []);


            const settingsResponse = await statisticsApi.getData('daily', { 
                start_date: new Date().toISOString().split('T')[0], 
                end_date: new Date().toISOString().split('T')[0] 
            });
            this.setState('settings', settingsResponse.menu_access_stats || []);


            const scheduleResponse = await scheduleSettingsApi.getSettings();
            this.setState('scheduleSettings', scheduleResponse);


            const excelResponse = await excelTemplateApi.getInfo();
            this.setState('excelTemplateInfo', excelResponse);

            return true;
        } catch (error) {

            return false;
        }
    }
}


export const stateManager = new StateManager();