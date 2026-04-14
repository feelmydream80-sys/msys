// static/js/modules/popup/popupManager.js

import { showToast } from '../../utils/toast.js';
import { popupStorage } from './popupStorage.js';

/**
 * 팝업 관리 클래스
 * Displays and manages popup windows
 */
export class PopupManager {
    constructor() {
        this.popups = [];
        this.currentIndex = 0;
        this.currentPopupElement = null;
        this.overlayElement = null;
        this.isInitialized = false;
    }

    /**
     * 팝업 매니저 초기화 및 활성 팝업 조회
     */
    async init() {
        if (this.isInitialized) return;

        // 만료된 숨김 상태 정리
        popupStorage.clearExpiredHidden();

        // 스타일 주입
        this.createPopupStyles();

        // 활성 팝업 조회
        await this.fetchActivePopups();

        this.isInitialized = true;
    }

    /**
     * API를 호출하여 활성 팝업 목록을 가져옵니다.
     */
    async fetchActivePopups() {
        try {
            const response = await fetch('/api/popups/active');
            
            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('PopupManager: Unauthorized');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.popups && Array.isArray(data.popups)) {
                this.popups = data.popups.filter(popup => this.shouldShowPopup(popup));
                this.currentIndex = 0;

                // 첫 번째 팝업 표시
                if (this.popups.length > 0) {
                    this.showNextPopup();
                }
            }
        } catch (error) {
            console.error('PopupManager: Failed to fetch active popups', error);
        }
    }

    /**
     * 팝업을 표시해야 하는지 확인합니다.
     * @param {Object} popup - 팝업 객체
     * @param {string} popup.id - 팝업 ID
     * @returns {boolean} 표시해야 하면 true
     */
    shouldShowPopup(popup) {
        if (!popup || !popup.id) return false;

        // localStorage에 숨김 상태가 있는지 확인
        if (popupStorage.isPopupHidden(popup.id)) {
            return false;
        }

        // 시작/종료 시간 확인
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

    /**
     * 단일 팝업을 표시합니다.
     * @param {Object} popup - 팝업 객체
     */
    showPopup(popup) {
        if (!popup) return;

        // 이미 표시 중인 팝업이 있으면 닫기
        if (this.currentPopupElement) {
            this.closeCurrentPopup(false);
        }

        // 오버레이 생성
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'popup-overlay';
        this.overlayElement.addEventListener('click', (e) => {
            if (e.target === this.overlayElement) {
                this.closeCurrentPopup(false);
            }
        });

        // 팝업 컨테이너 생성
        const popupContainer = document.createElement('div');
        popupContainer.className = 'popup-container';
        popupContainer.innerHTML = this.renderPopupHTML(popup);

        // 오버레이에 팝업 추가
        this.overlayElement.appendChild(popupContainer);
        document.body.appendChild(this.overlayElement);

        this.currentPopupElement = popupContainer;

        // 이벤트 리스너 설정
        this.setupEventListeners(popup);

        // 애니메이션을 위한 타이밍
        requestAnimationFrame(() => {
            this.overlayElement.classList.add('active');
            popupContainer.classList.add('active');
        });

        // 팝업 표시 카운트 증가 API 호출 (선택적)
        this.trackPopupView(popup.id);
    }

    /**
     * 다음 팝업을 표시합니다.
     */
    showNextPopup() {
        if (this.currentIndex >= this.popups.length) {
            this.currentIndex = 0;
            return;
        }

        const popup = this.popups[this.currentIndex];
        this.showPopup(popup);
    }

    /**
     * 현재 팝업을 닫습니다.
     * @param {boolean} hideToday - 오늘 하루 숨김 여부
     */
    closeCurrentPopup(hideToday = false) {
        if (!this.currentPopupElement || !this.overlayElement) return;

        const currentPopup = this.popups[this.currentIndex];

        // 오늘 하루 숨김 처리
        if (hideToday && currentPopup) {
            popupStorage.setPopupHidden(currentPopup.id, 24);
        }

        // 애니메이션 효과
        this.currentPopupElement.classList.remove('active');
        this.overlayElement.classList.remove('active');

        // 애니메이션 후 DOM에서 제거
        setTimeout(() => {
            if (this.overlayElement) {
                this.overlayElement.remove();
                this.overlayElement = null;
                this.currentPopupElement = null;
            }

            // 다음 팝업 표시
            this.currentIndex++;
            if (this.currentIndex < this.popups.length) {
                setTimeout(() => this.showNextPopup(), 300);
            }
        }, 300);
    }

    /**
     * 팝업 HTML을 생성합니다.
     * @param {Object} popup - 팝업 객체
     * @returns {string} HTML 문자열
     */
    renderPopupHTML(popup) {
        const { id, title, content, type = 'text', image_url, link_url, link_text } = popup;

        // 이미지 타입 팝업
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

        // 텍스트 타입 팝업 (기본)
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

    /**
     * 이벤트 리스너를 설정합니다.
     * @param {Object} popup - 팝업 객체
     */
    setupEventListeners(popup) {
        if (!this.currentPopupElement) return;

        // 닫기 버튼
        const closeButtons = this.currentPopupElement.querySelectorAll('[data-action="close"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const hideCheckbox = this.currentPopupElement.querySelector(`#hide-today-${popup.id}`);
                const hideToday = hideCheckbox ? hideCheckbox.checked : false;
                this.closeCurrentPopup(hideToday);
            });
        });

        // 링크 클릭 추적
        const linkElements = this.currentPopupElement.querySelectorAll('[data-popup-id]');
        linkElements.forEach(link => {
            link.addEventListener('click', () => {
                this.trackPopupClick(popup.id);
            });
        });

        // ESC 키로 닫기
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

    /**
     * 팝업 CSS 스타일을 주입합니다.
     */
    createPopupStyles() {
        // 이미 스타일이 주입되어 있으면 리턴
        if (document.getElementById('popup-manager-styles')) return;

        const styleElement = document.createElement('style');
        styleElement.id = 'popup-manager-styles';
        styleElement.textContent = `
            /* Popup Overlay */
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

            /* Popup Container */
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

            /* Popup Header */
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

            /* Popup Body */
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

            /* Popup Image */
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

            /* Popup Footer */
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

            /* Hide Today Checkbox */
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

            /* Popup Buttons */
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

            /* Responsive Design */
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

    /**
     * HTML 특수문자를 이스케이프합니다.
     * @param {string} text - 원본 텍스트
     * @returns {string} 이스케이프된 텍스트
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 콘텐츠를 포맷팅합니다 (줄바꿈 처리 등).
     * @param {string} content - 원본 콘텐츠
     * @returns {string} 포맷팅된 콘텐츠
     */
    formatContent(content) {
        if (!content) return '';
        return this.escapeHtml(content);
    }

    /**
     * 팝업 조회를 추적합니다.
     * @param {string} popupId - 팝업 ID
     */
    async trackPopupView(popupId) {
        try {
            await fetch(`/api/popups/${popupId}/view`, { method: 'POST' });
        } catch (error) {
            // 조회 추적 실패는 무시
            console.debug('PopupManager: Failed to track view', error);
        }
    }

    /**
     * 팝업 링크 클릭을 추적합니다.
     * @param {string} popupId - 팝업 ID
     */
    async trackPopupClick(popupId) {
        try {
            await fetch(`/api/popups/${popupId}/click`, { method: 'POST' });
        } catch (error) {
            // 클릭 추적 실패는 무시
            console.debug('PopupManager: Failed to track click', error);
        }
    }

    /**
     * 모든 팝업을 즉시 닫습니다.
     */
    closeAll() {
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = null;
            this.currentPopupElement = null;
        }
        this.currentIndex = this.popups.length; // 더 이상 팝업을 표시하지 않도록 설정
    }

    /**
     * 팝업 매니저를 재설정합니다.
     */
    reset() {
        this.closeAll();
        this.popups = [];
        this.currentIndex = 0;
        this.isInitialized = false;
    }
}

// 싱글톤 인스턴스 제공
export const popupManager = new PopupManager();

// 전역 접근을 위한 window 객체 등록
if (typeof window !== 'undefined') {
    window.PopupManager = PopupManager;
    window.popupManager = popupManager;
}
