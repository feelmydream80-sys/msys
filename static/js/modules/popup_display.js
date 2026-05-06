

const PopupDisplay = (function() {
    'use strict';


    const CONFIG = {
        MAX_POPUPS: 11,
        Z_INDEX_BASE: 1000,
        OFFSET_STEP: 20,
        STORAGE_KEY: 'hiddenPopups',
        MAX_WIDTH: 800,
        MAX_HEIGHT: 600
    };


    const POSITIONS = {
        'TOP_LEFT': { top: '10%', left: '5%', transform: 'none' },
        'TOP_CENTER': { top: '10%', left: '40%', transform: 'translateX(-50%)' },
        'TOP_RIGHT': { top: '10%', left: '80%', transform: 'none' },
        'CENTER_LEFT': { top: '40%', left: '5%', transform: 'translateY(-50%)' },
        'CENTER': { top: '40%', left: '40%', transform: 'translate(-50%, -50%)' },
        'CENTER_RIGHT': { top: '40%', left: '80%', transform: 'translateY(-50%)' },
        'BOTTOM_LEFT': { bottom: '30%', left: '5%', transform: 'none' },
        'BOTTOM_CENTER': { bottom: '30%', left: '40%', transform: 'translateX(-50%)' },
        'BOTTOM_RIGHT': { bottom: '30%', left: '80%', transform: 'none' }
    };


    let dragState = {
        isDragging: false,
        popup: null,
        startX: 0,
        startY: 0,
        initialLeft: 0,
        initialTop: 0
    };


    let activePopups = [];
    let lastClickedPopupId = null;
    let positionOffsetCounter = {};

    
    function init() {

        cleanupHiddenPopups();
        

        loadAndDisplayPopups();
        

        setupEscListener();
    }
    
    
    function setupEscListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {

                const popupId = lastClickedPopupId || (activePopups.length > 0 ? activePopups[activePopups.length - 1].popup_id : null);
                if (popupId) {
                    closePopup(popupId, false);
                    lastClickedPopupId = null;
                }
            }
        });
    }

    
    function cleanupHiddenPopups() {
        const hiddenPopups = getHiddenPopups();
        const now = new Date();
        let hasChanges = false;

        Object.keys(hiddenPopups).forEach(id => {
            if (new Date(hiddenPopups[id]) < now) {
                delete hiddenPopups[id];
                hasChanges = true;
            }
        });

        if (hasChanges) {
            saveHiddenPopups(hiddenPopups);
        }
    }

    
    function getHiddenPopups() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            
            return {};
        }
    }

    
    function saveHiddenPopups(hiddenPopups) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(hiddenPopups));
        } catch (e) {
            
        }
    }

    
    async function loadAndDisplayPopups() {

        positionOffsetCounter = {};
        
        try {
            const response = await fetch('/api/popups/active');
            if (!response.ok) {
                throw new Error('Failed to load popups');
            }

            const popups = await response.json();
            
            if (!Array.isArray(popups) || popups.length === 0) {
                return;
            }


            const hiddenPopups = getHiddenPopups();
            const now = new Date();

            activePopups = popups
                .filter(popup => {
                    const hideUntil = hiddenPopups[popup.popup_id];
                    return !hideUntil || new Date(hideUntil) < now;
                })
                .sort((a, b) => (a.disp_ord || 999) - (b.disp_ord || 999))
                .slice(0, CONFIG.MAX_POPUPS);


            activePopups.forEach((popup, index) => {
                createPopupElement(popup, index);
            });

        } catch (error) {
            
        }
    }

    
    function setupDraggable(titleBar, popupContent) {
        titleBar.addEventListener('mousedown', (e) => {

            if (e.target.classList.contains('popup-close-btn')) return;

            dragState.isDragging = true;
            dragState.popup = popupContent;
            dragState.startX = e.clientX;
            dragState.startY = e.clientY;
            

            const computedStyle = window.getComputedStyle(popupContent);
            const currentLeft = parseInt(computedStyle.left) || 0;
            const currentTop = parseInt(computedStyle.top) || 0;
            
            dragState.initialLeft = currentLeft;
            dragState.initialTop = currentTop;
            

            popupContent.style.transform = 'none';
            popupContent.style.left = currentLeft + 'px';
            popupContent.style.top = currentTop + 'px';
            popupContent.style.right = 'auto';
            popupContent.style.bottom = 'auto';
            
            titleBar.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragState.isDragging || !dragState.popup) return;
            
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;
            
            const newLeft = dragState.initialLeft + dx;
            const newTop = dragState.initialTop + dy;
            
            dragState.popup.style.left = newLeft + 'px';
            dragState.popup.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (dragState.isDragging) {
                titleBar.style.cursor = 'grab';
                dragState.isDragging = false;
                dragState.popup = null;
            }
        });
    }

    
    function getInitialPosition(position, positionKey) {
        const offset = (positionOffsetCounter[positionKey] || 0) * CONFIG.OFFSET_STEP;
        let left = 20;
        let top = 60;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        

        if (position.left !== undefined) {
            if (position.left.endsWith('%')) {
                left = (viewportWidth * parseFloat(position.left) / 100) + offset;
            } else if (position.left === '50%') {
                left = (viewportWidth / 2) + offset;
            } else {
                left = parseInt(position.left) + offset;
            }
        }
        

        if (position.right !== undefined) {
            if (position.right.endsWith('%')) {
                left = (viewportWidth * (100 - parseFloat(position.right)) / 100) + offset;
            } else {
                left = viewportWidth - parseInt(position.right) - offset;
            }
        }
        

        if (position.top !== undefined) {
            if (position.top.endsWith('%')) {
                top = (viewportHeight * parseFloat(position.top) / 100);
            } else if (position.top === '50%') {
                top = (viewportHeight / 2);
            } else {
                top = parseInt(position.top);
            }
        }
        

        if (position.bottom !== undefined) {
            if (position.bottom.endsWith('%')) {
                top = (viewportHeight * (100 - parseFloat(position.bottom)) / 100);
            } else {
                top = viewportHeight - parseInt(position.bottom);
            }
        }
        
        return { left, top };
    }

    
    function createPopupElement(popup, index) {
        const zIndex = CONFIG.Z_INDEX_BASE + index;
        popup.zIndex = zIndex;


        const positionKey = (popup.loc && POSITIONS[popup.loc]) ? popup.loc : 'CENTER';
        const position = POSITIONS[positionKey];


        const width = Math.min(popup.width || 500, CONFIG.MAX_WIDTH);
        const height = popup.height ? Math.min(popup.height, CONFIG.MAX_HEIGHT) : null;


        const initialPos = getInitialPosition(position, positionKey);


        positionOffsetCounter[positionKey] = (positionOffsetCounter[positionKey] || 0) + 1;


        const content = document.createElement('div');
        content.className = 'popup-display-content';
        content.id = 'popup-' + popup.popup_id;
        content.setAttribute('data-popup-id', popup.popup_id);
        content.style.cssText = 'position:fixed;left:' + initialPos.left + 'px;top:' + initialPos.top + 'px;width:' + width + 'px;' + (height ? 'height:' + height + 'px;' : 'max-height:80vh;') + 'max-width:' + CONFIG.MAX_WIDTH + 'px;max-height:' + CONFIG.MAX_HEIGHT + 'px;background:' + (popup.bg_colr || '#FFFFFF') + ';border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;z-index:' + zIndex + ';transform:none;';


        if (popup.titl) {
            const titleBar = document.createElement('div');
            titleBar.className = 'popup-title-bar';
            titleBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid #eee;background:' + (popup.bg_colr || '#FFFFFF') + ';cursor:grab;user-select:none;';

            const titleText = document.createElement('h3');
            titleText.textContent = popup.titl;
            titleText.style.cssText = 'margin:0;font-size:18px;font-weight:600;flex:1;';


            const closeBtn = document.createElement('button');
            closeBtn.className = 'popup-close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.style.cssText = 'background:none;border:none;font-size:24px;line-height:1;cursor:pointer;color:#666;padding:0;margin:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:background-color 0.2s;';
            closeBtn.onmouseover = function() { this.style.backgroundColor = '#f0f0f0'; };
            closeBtn.onmouseout = function() { this.style.backgroundColor = 'transparent'; };
            closeBtn.onclick = function() { closePopup(popup.popup_id, false); };

            titleBar.appendChild(titleText);
            titleBar.appendChild(closeBtn);
            content.appendChild(titleBar);


            setupDraggable(titleBar, content);
        } else {

            const closeBtn = document.createElement('button');
            closeBtn.className = 'popup-close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:none;border:none;font-size:24px;line-height:1;cursor:pointer;color:#666;padding:0;margin:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:background-color 0.2s;z-index:10;';
            closeBtn.onmouseover = function() { this.style.backgroundColor = '#f0f0f0'; };
            closeBtn.onmouseout = function() { this.style.backgroundColor = 'transparent'; };
            closeBtn.onclick = function() { closePopup(popup.popup_id, false); };
            content.appendChild(closeBtn);
        }


        const body = document.createElement('div');
        body.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';


        if (popup.img_path) {
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-bottom:15px;text-align:center;';
            
            const img = document.createElement('img');
            img.src = popup.img_path;
            img.style.cssText = 'max-width:100%;height:auto;border-radius:4px;cursor:' + (popup.lnk_url ? 'pointer' : 'default') + ';';
            
            if (popup.lnk_url) {
                img.onclick = function() { window.open(popup.lnk_url, '_blank'); };
                img.title = '클릭하여 이동';
            }
            
            imgContainer.appendChild(img);
            body.appendChild(imgContainer);
        }


        if (popup.cont) {
            const text = document.createElement('div');
            text.innerHTML = popup.cont;
            text.style.cssText = 'white-space:pre-wrap;line-height:1.6;';
            body.appendChild(text);
        }

        content.appendChild(body);


        const footer = document.createElement('div');
        footer.style.cssText = 'padding:15px 20px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.02);';


        if (popup.hide_opt_yn === 'Y') {
            const hideContainer = document.createElement('div');
            hideContainer.style.cssText = 'display:flex;align-items:center;gap:10px;';

            const label = document.createElement('label');
            label.textContent = '보지 않기:';
            label.style.fontSize = '14px';
            hideContainer.appendChild(label);

            const select = document.createElement('select');
            select.id = 'hide-days-' + popup.popup_id;
            select.style.cssText = 'padding:5px 10px;border:1px solid #ddd;border-radius:4px;font-size:14px;';

            const maxDays = Math.min(popup.hide_days_max || 7, 7);
            for (let i = 1; i <= maxDays; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i + '일';
                if (i === 1) option.selected = true;
                select.appendChild(option);
            }

            hideContainer.appendChild(select);
            

            const applyButton = document.createElement('button');
            applyButton.textContent = '적용';
            applyButton.style.cssText = 'padding:5px 15px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-left:5px;';
            applyButton.onclick = function() {
                const hideDays = parseInt(document.getElementById('hide-days-' + popup.popup_id).value);
                closePopup(popup.popup_id, true, hideDays);
            };
            hideContainer.appendChild(applyButton);
            
            footer.appendChild(hideContainer);
        }

        content.appendChild(footer);


        document.body.appendChild(content);


        content.addEventListener('mousedown', (e) => {
            lastClickedPopupId = popup.popup_id;

            bringToFront(popup.popup_id);
        });
    }

    
    function bringToFront(popupId) {
        const popup = document.getElementById('popup-' + popupId);
        if (popup) {

            let maxZ = CONFIG.Z_INDEX_BASE;
            document.querySelectorAll('.popup-display-content').forEach(p => {
                const z = parseInt(p.style.zIndex) || CONFIG.Z_INDEX_BASE;
                if (z > maxZ) maxZ = z;
            });
            popup.style.zIndex = maxZ + 1;
        }
    }

    
    function closePopup(popupId, shouldHide, days) {
        days = days || 0;
        

        const popup = document.getElementById('popup-' + popupId);
        if (popup) {
            popup.remove();
        }


        activePopups = activePopups.filter(p => p.popup_id !== popupId);


        if (shouldHide && days > 0) {
            hidePopup(popupId, days);
        }
    }

    
    function hidePopup(popupId, days) {
        const hiddenPopups = getHiddenPopups();
        const hideUntil = new Date();
        hideUntil.setDate(hideUntil.getDate() + days);
        hideUntil.setHours(23, 59, 59, 999);

        hiddenPopups[popupId] = hideUntil.toISOString();
        saveHiddenPopups(hiddenPopups);

        
    }

    
    function shouldShowPopup(popupId) {
        const hiddenPopups = getHiddenPopups();
        const hideUntil = hiddenPopups[popupId];
        
        if (!hideUntil) return true;
        
        return new Date() > new Date(hideUntil);
    }

    
    function refresh() {

        document.querySelectorAll('.popup-display-content').forEach(function(popup) {
            popup.remove();
        });
        
        activePopups = [];
        positionOffsetCounter = {};
        

        loadAndDisplayPopups();
    }


    return {
        init: init,
        refresh: refresh,
        closePopup: closePopup,
        shouldShowPopup: shouldShowPopup,
        POSITIONS: POSITIONS
    };
})();


document.addEventListener('DOMContentLoaded', function() {

    const isLoginPage = window.location.pathname === '/login';
    if (!isLoginPage) {
        PopupDisplay.init();
    }
});


window.PopupDisplay = PopupDisplay;
