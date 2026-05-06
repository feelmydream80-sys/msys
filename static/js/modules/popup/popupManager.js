

import { showToast } from '../../utils/toast.js';
import { popupStorage } from './popupStorage.js';


export class PopupManager {
    constructor() {
        this.popups = [];
        this.currentIndex = 0;
        this.currentPopupElement = null;
        this.overlayElement = null;
        this.isInitialized = false;
    }

    
    async init() {
        if (this.isInitialized) return;


        popupStorage.clearExpiredHidden();


        this.createPopupStyles();


        await this.fetchActivePopups();

        this.isInitialized = true;
    }

    
    async fetchActivePopups() {
        try {
            const response = await fetch('/api/popups/active');
            
            if (!response.ok) {
                if (response.status === 401) {

                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.popups && Array.isArray(data.popups)) {
                this.popups = data.popups.filter(popup => this.shouldShowPopup(popup));
                this.currentIndex = 0;


                if (this.popups.length > 0) {
                    this.showNextPopup();
                }
            }
        } catch (error) {

        }
    }

    
    shouldShowPopup(popup) {
        if (!popup || !popup.id) return false;


        if (popupStorage.isPopupHidden(popup.id)) {
            return false;
        }


        const now = new Date();
        
        if (popup.start_date) {
            const startDate = new Date(popup.start_date);
            if (now < startDate) return false;
        }

        if (popup.end_date) {
            const endDate = new Date(popup.end_date);
            if (now > endDate) return false;
        }

        return true;
    }

    
    showPopup(popup) {
        if (!popup) return;


        if (this.currentPopupElement) {
            this.closeCurrentPopup(false);
        }


        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'popup-overlay';
        this.overlayElement.addEventListener('click', (e) => {
            if (e.target === this.overlayElement) {
                this.closeCurrentPopup(false);
            }
        });


        const popupContainer = document.createElement('div');
        popupContainer.className = 'popup-container';
        popupContainer.innerHTML = this.renderPopupHTML(popup);


        this.overlayElement.appendChild(popupContainer);
        document.body.appendChild(this.overlayElement);

        this.currentPopupElement = popupContainer;


        this.setupEventListeners(popup);


        requestAnimationFrame(() => {
            this.overlayElement.classList.add('active');
            popupContainer.classList.add('active');
        });


        this.trackPopupView(popup.id);
    }

    
    showNextPopup() {
        if (this.currentIndex >= this.popups.length) {
            this.currentIndex = 0;
            return;
        }

        const popup = this.popups[this.currentIndex];
        this.showPopup(popup);
    }

    
    closeCurrentPopup(hideToday = false) {
        if (!this.currentPopupElement || !this.overlayElement) return;

        const currentPopup = this.popups[this.currentIndex];


        if (hideToday && currentPopup) {
            popupStorage.setPopupHidden(currentPopup.id, 24);
        }


        this.currentPopupElement.classList.remove('active');
        this.overlayElement.classList.remove('active');


        setTimeout(() => {
            if (this.overlayElement) {
                this.overlayElement.remove();
                this.overlayElement = null;
                this.currentPopupElement = null;
            }


            this.currentIndex++;
            if (this.currentIndex < this.popups.length) {
                setTimeout(() => this.showNextPopup(), 300);
            }
        }, 300);
    }

    
    renderPopupHTML(popup) {
        const { id, title, content, type = 'text', image_url, link_url, link_text } = popup;


        if (type === 'image' && image_url) {
            return `
                <div class="popup-header">
                    <h3 class="popup-title">${this.escapeHtml(title || '')}</h3>
                    <button class="popup-close-btn" data-action="close" aria-label="닫기">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="popup-body popup-image-body">
                    ${link_url ? `<a href="${this.escapeHtml(link_url)}" target="_blank" rel="noopener noreferrer" class="popup-image-link" data-popup-id="${this.escapeHtml(id)}">` : ''}
                        <img src="${this.escapeHtml(image_url)}" alt="${this.escapeHtml(title || '팝업 이미지')}" class="popup-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="popup-image-error" style="display: none;">
                            <i class="fas fa-image"></i>
                            <p>이미지를 불러올 수 없습니다</p>
                        </div>
                    ${link_url ? '</a>' : ''}
                    ${content ? `<div class="popup-image-caption">${this.escapeHtml(content)}</div>` : ''}
                </div>
                <div class="popup-footer">
                    <label class="popup-hide-checkbox">
                        <input type="checkbox" id="hide-today-${this.escapeHtml(id)}">
                        <span class="checkmark"></span>
                        <span class="label-text">오늘 하루 보지 않기</span>
                    </label>
                    <button class="btn btn-secondary popup-btn-close" data-action="close">닫기</button>
                    ${link_url ? `<a href="${this.escapeHtml(link_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary popup-btn-link" data-popup-id="${this.escapeHtml(id)}">${this.escapeHtml(link_text || '자세히 보기')}</a>` : ''}
                </div>
            `;
        }


        return `
            <div class="popup-header">
                <h3 class="popup-title">${this.escapeHtml(title || '')}</h3>
                <button class="popup-close-btn" data-action="close" aria-label="닫기">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="popup-body">
                <div class="popup-content-text">${this.formatContent(content || '')}</div>
            </div>
            <div class="popup-footer">
                <label class="popup-hide-checkbox">
                    <input type="checkbox" id="hide-today-${this.escapeHtml(id)}">
                    <span class="checkmark"></span>
                    <span class="label-text">오늘 하루 보지 않기</span>
                </label>
                <button class="btn btn-secondary popup-btn-close" data-action="close">닫기</button>
                ${link_url ? `<a href="${this.escapeHtml(link_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary popup-btn-link" data-popup-id="${this.escapeHtml(id)}">${this.escapeHtml(link_text || '자세히 보기')}</a>` : ''}
            </div>
        `;
    }

    
    setupEventListeners(popup) {
        if (!this.currentPopupElement) return;


        const closeButtons = this.currentPopupElement.querySelectorAll('[data-action="close"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const hideCheckbox = this.currentPopupElement.querySelector(`#hide-today-${popup.id}`);
                const hideToday = hideCheckbox ? hideCheckbox.checked : false;
                this.closeCurrentPopup(hideToday);
            });
        });


        const linkElements = this.currentPopupElement.querySelectorAll('[data-popup-id]');
        linkElements.forEach(link => {
            link.addEventListener('click', () => {
                this.trackPopupClick(popup.id);
            });
        });


        const escHandler = (e) => {
            if (e.key === 'Escape') {
                const hideCheckbox = this.currentPopupElement.querySelector(`#hide-today-${popup.id}`);
                const hideToday = hideCheckbox ? hideCheckbox.checked : false;
                this.closeCurrentPopup(hideToday);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    
    createPopupStyles() {

        if (document.getElementById('popup-manager-styles')) return;

        const styleElement = document.createElement('style');
        styleElement.id = 'popup-manager-styles';
        styleElement.textContent = `
            
            .popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .popup-overlay.active {
                opacity: 1;
            }

            
            .popup-container {
                background-color: var(--color-surface, #ffffff);
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transform: scale(0.9) translateY(20px);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }

            .popup-container.active {
                transform: scale(1) translateY(0);
                opacity: 1;
            }

            
            .popup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.25rem;
                border-bottom: 1px solid var(--color-outline, #e5e7eb);
                background-color: var(--color-surface, #ffffff);
            }

            .popup-title {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--color-text-primary, #1f2937);
                margin: 0;
                line-height: 1.4;
            }

            .popup-close-btn {
                background: none;
                border: none;
                font-size: 1.25rem;
                color: var(--color-text-secondary, #6b7280);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 0.375rem;
                width: 2rem;
                height: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .popup-close-btn:hover {
                background-color: var(--color-surface-hover, #f3f4f6);
                color: var(--color-text-primary, #1f2937);
            }

            
            .popup-body {
                padding: 1.25rem;
                overflow-y: auto;
                flex: 1;
                background-color: var(--color-surface, #ffffff);
            }

            .popup-content-text {
                font-size: 0.9375rem;
                line-height: 1.6;
                color: var(--color-text-primary, #374151);
                white-space: pre-wrap;
                word-break: break-word;
            }

            
            .popup-image-body {
                padding: 0;
            }

            .popup-image {
                width: 100%;
                height: auto;
                display: block;
            }

            .popup-image-link {
                display: block;
                text-decoration: none;
            }

            .popup-image-caption {
                padding: 1rem 1.25rem;
                font-size: 0.875rem;
                color: var(--color-text-secondary, #6b7280);
                text-align: center;
                border-top: 1px solid var(--color-outline, #e5e7eb);
            }

            .popup-image-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                color: var(--color-text-muted, #9ca3af);
                gap: 0.75rem;
            }

            .popup-image-error i {
                font-size: 3rem;
            }

            
            .popup-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 1.25rem;
                border-top: 1px solid var(--color-outline, #e5e7eb);
                background-color: var(--color-surface-variant, #f9fafb);
                gap: 0.75rem;
                flex-wrap: wrap;
            }

            
            .popup-hide-checkbox {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                font-size: 0.875rem;
                color: var(--color-text-secondary, #6b7280);
                user-select: none;
                flex-shrink: 0;
            }

            .popup-hide-checkbox input {
                display: none;
            }

            .popup-hide-checkbox .checkmark {
                width: 1.125rem;
                height: 1.125rem;
                border: 2px solid var(--color-outline, #d1d5db);
                border-radius: 0.25rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                background-color: var(--color-surface, #ffffff);
            }

            .popup-hide-checkbox input:checked + .checkmark {
                background-color: var(--color-primary, #3b82f6);
                border-color: var(--color-primary, #3b82f6);
            }

            .popup-hide-checkbox input:checked + .checkmark::after {
                content: '✓';
                color: white;
                font-size: 0.75rem;
                font-weight: bold;
            }

            .popup-hide-checkbox:hover .checkmark {
                border-color: var(--color-primary, #3b82f6);
            }

            .popup-hide-checkbox .label-text {
                white-space: nowrap;
            }

            
            .popup-btn-close,
            .popup-btn-link {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
                border-radius: 0.375rem;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
            }

            .popup-btn-close {
                background-color: transparent;
                border: 1px solid var(--color-outline, #d1d5db);
                color: var(--color-text-secondary, #6b7280);
            }

            .popup-btn-close:hover {
                background-color: var(--color-surface-hover, #f3f4f6);
                border-color: var(--color-text-secondary, #6b7280);
            }

            .popup-btn-link {
                background-color: var(--color-primary, #3b82f6);
                border: 1px solid var(--color-primary, #3b82f6);
                color: white;
            }

            .popup-btn-link:hover {
                background-color: var(--color-primary-hover, #2563eb);
                border-color: var(--color-primary-hover, #2563eb);
            }

            
            @media (max-width: 640px) {
                .popup-overlay {
                    padding: 0.75rem;
                }

                .popup-container {
                    max-width: 100%;
                    max-height: 85vh;
                    border-radius: 0.75rem;
                }

                .popup-header {
                    padding: 0.875rem 1rem;
                }

                .popup-title {
                    font-size: 1rem;
                }

                .popup-body {
                    padding: 1rem;
                }

                .popup-content-text {
                    font-size: 0.875rem;
                }

                .popup-footer {
                    padding: 0.875rem 1rem;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 0.75rem;
                }

                .popup-hide-checkbox {
                    justify-content: center;
                    order: 2;
                }

                .popup-btn-close,
                .popup-btn-link {
                    width: 100%;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }

    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    
    formatContent(content) {
        if (!content) return '';
        return this.escapeHtml(content);
    }

    
    async trackPopupView(popupId) {
        try {
            await fetch(`/api/popups/${popupId}/view`, { method: 'POST' });
        } catch (error) {


        }
    }

    
    async trackPopupClick(popupId) {
        try {
            await fetch(`/api/popups/${popupId}/click`, { method: 'POST' });
        } catch (error) {


        }
    }

    
    closeAll() {
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = null;
            this.currentPopupElement = null;
        }
        this.currentIndex = this.popups.length;
    }

    
    reset() {
        this.closeAll();
        this.popups = [];
        this.currentIndex = 0;
        this.isInitialized = false;
    }
}


export const popupManager = new PopupManager();


if (typeof window !== 'undefined') {
    window.PopupManager = PopupManager;
    window.popupManager = popupManager;
}
