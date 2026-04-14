// @DOC_FILE: popupManagement.js
// @DOC_DESC: 팝업 관리 탭 모듈

import { showToast } from '../utils/toast.js';
import { popupManagementApi } from '../services/api.js';

/**
 * 팝업 관리 탭 클래스
 */
class PopupManagementTab {
    constructor() {
        this.elements = {
            tab: null,
            tableBody: null,
            searchInput: null,
            addPopupBtn: null,
            popupModal: null,
            popupForm: null,
            popupPreview: null
        };

        this.currentPopupId = null;
        this.uploadedImageFile = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.totalPopups = 0;
        this.debounceTimer = null;
    }

    initElements() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return false;

        this.elements.tab = container.querySelector('button[data-tab="popupManagement"]');
        this.elements.tableBody = container.querySelector('#popupTableBody');
        this.elements.searchInput = container.querySelector('#popupSearchInput');
        this.elements.addPopupBtn = container.querySelector('#addPopupBtn');
        this.elements.popupModal = document.getElementById('popupModal');
        this.elements.popupForm = document.getElementById('popupForm');
        this.elements.popupPreview = document.getElementById('popupPreviewContainer');

        return true;
    }

    initEventListeners() {
        if (this.elements.tab) {
            this.elements.tab.addEventListener('click', () => this.loadPopups());
        }

        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.currentPage = 1;
                    this.loadPopups();
                }, 300);
            });
        }

        if (this.elements.addPopupBtn) {
            this.elements.addPopupBtn.addEventListener('click', () => this.openPopupModal());
        }

        const closeModalBtn = document.getElementById('closePopupModal');
        const cancelBtn = document.getElementById('cancelPopupBtn');
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closePopupModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closePopupModal());
        }

        if (this.elements.popupModal) {
            this.elements.popupModal.addEventListener('click', (e) => {
                if (e.target === this.elements.popupModal) {
                    this.closePopupModal();
                }
            });
        }

        const saveBtn = document.getElementById('savePopupBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePopup());
        }

        const previewBtn = document.getElementById('previewPopupBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewPopup());
        }

        const imageInput = document.getElementById('popupImageInput');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        this.initFormValidation();
    }

    initFormValidation() {
        const inputs = document.querySelectorAll('#popupForm input[required], #popupForm textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = '필수 입력 항목입니다.';
        }

        if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                errorMessage = '유효한 URL을 입력해주세요.';
            }
        }

        if (field.type === 'number' && value) {
            const num = parseInt(value);
            if (isNaN(num) || num < 0) {
                isValid = false;
                errorMessage = '0 이상의 숫자를 입력해주세요.';
            }
        }

        if (field.id === 'popupEndDate') {
            const startDate = document.getElementById('popupStartDate')?.value;
            if (startDate && value && new Date(value) < new Date(startDate)) {
                isValid = false;
                errorMessage = '종료일은 시작일보다 이후여야 합니다.';
            }
        }

        if (!isValid) {
            field.classList.add('error');
            this.showFieldError(field, errorMessage);
        } else {
            field.classList.remove('error');
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        let errorEl = field.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            errorEl.style.color = '#dc3545';
            errorEl.style.fontSize = '0.85em';
            errorEl.style.marginTop = '4px';
            errorEl.style.display = 'block';
            field.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    clearFieldError(field) {
        const errorEl = field.parentElement.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
        field.classList.remove('error');
    }

    validateForm() {
        const requiredFields = document.querySelectorAll('#popupForm input[required], #popupForm textarea[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async loadPopups() {
        try {
            const searchTerm = this.elements.searchInput ? this.elements.searchInput.value : '';
            const data = await popupManagementApi.getPopups(searchTerm, this.currentPage, this.itemsPerPage);

            this.totalPopups = data.total || 0;
            this.totalPages = Math.ceil(this.totalPopups / this.itemsPerPage);

            this.renderPopupTable(data.popups || []);
            this.renderPagination();
        } catch (error) {
            showToast('팝업 목록 로드 실패: ' + error.message, 'error');
        }
    }

    renderPopupTable(popups) {
        if (!this.elements.tableBody) return;

        this.elements.tableBody.innerHTML = '';

        if (popups.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="8" style="text-align: center; padding: 20px;">등록된 팝업이 없습니다.</td>';
            this.elements.tableBody.appendChild(row);
            return;
        }

        popups.forEach(popup => {
            const row = document.createElement('tr');
            const startDate = popup.start_date ? new Date(popup.start_date).toLocaleDateString('ko-KR') : '-';
            const endDate = popup.end_date ? new Date(popup.end_date).toLocaleDateString('ko-KR') : '-';
            const statusBadge = this.getStatusBadge(popup.status, popup.start_date, popup.end_date);

            row.innerHTML = '<td>' + popup.id + '</td>' +
                '<td>' + popup.title + '</td>' +
                '<td>' + startDate + ' ~ ' + endDate + '</td>' +
                '<td>' + (popup.width || 400) + 'px x ' + (popup.height || 300) + 'px</td>' +
                '<td>' + (popup.target_pages ? popup.target_pages.length : 0) + '개 페이지</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' + new Date(popup.created_at).toLocaleDateString('ko-KR') + '</td>' +
                '<td>' +
                    '<div class="action-buttons">' +
                        '<button class="btn btn-primary edit-btn" data-popup-id="' + popup.id + '">수정</button>' +
                        '<button class="btn btn-secondary preview-btn" data-popup-id="' + popup.id + '">미리보기</button>' +
                        '<button class="btn btn-danger delete-btn" data-popup-id="' + popup.id + '">삭제</button>' +
                    '</div>' +
                '</td>';

            this.elements.tableBody.appendChild(row);
        });

        this.addTableEventListeners();
    }

    getStatusBadge(status, startDate, endDate) {
        const now = new Date();
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        let displayStatus = status;
        let badgeClass = 'badge';

        if (status === 'ACTIVE') {
            if (start && end && now >= start && now <= end) {
                displayStatus = '게시 중';
                badgeClass += ' badge-success';
            } else if (end && now > end) {
                displayStatus = '기간 만료';
                badgeClass += ' badge-secondary';
            } else if (start && now < start) {
                displayStatus = '예약됨';
                badgeClass += ' badge-info';
            } else {
                displayStatus = '활성';
                badgeClass += ' badge-success';
            }
        } else {
            displayStatus = '비활성';
            badgeClass += ' badge-secondary';
        }

        return '<span class="' + badgeClass + '">' + displayStatus + '</span>';
    }

    addTableEventListeners() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return;

        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const popupId = e.target.dataset.popupId;
                this.openPopupModal(popupId);
            });
        });

        container.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const popupId = e.target.dataset.popupId;
                this.previewPopupById(popupId);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const popupId = e.target.dataset.popupId;
                this.deletePopup(popupId);
            });
        });
    }

    renderPagination() {
        const container = document.getElementById('popupPagination');
        if (!container) return;

        container.innerHTML = '';

        if (this.totalPages <= 1) return;

        const itemsPerPageSelect = document.createElement('select');
        itemsPerPageSelect.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 15px;';
        [5, 10, 20, 50].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option + ' 건';
            if (option === this.itemsPerPage) {
                optionElement.selected = true;
            }
            itemsPerPageSelect.appendChild(optionElement);
        });
        itemsPerPageSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadPopups();
        });

        container.appendChild(itemsPerPageSelect);

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '이전';
        prevBtn.className = 'btn';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadPopups();
            }
        });
        container.appendChild(prevBtn);

        for (let i = 1; i <= this.totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = 'btn ' + (i === this.currentPage ? 'btn-primary' : '');
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadPopups();
            });
            container.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '다음';
        nextBtn.className = 'btn';
        nextBtn.disabled = this.currentPage === this.totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadPopups();
            }
        });
        container.appendChild(nextBtn);
    }

    async openPopupModal(popupId = null) {
        this.currentPopupId = popupId;
        this.uploadedImageFile = null;

        const modalTitle = document.getElementById('popupModalTitle');
        const form = this.elements.popupForm;

        if (popupId) {
            modalTitle.textContent = '팝업 수정';
            try {
                const popup = await popupManagementApi.getPopup(popupId);
                this.populateForm(popup);
            } catch (error) {
                showToast('팝업 정보 로드 실패: ' + error.message, 'error');
                return;
            }
        } else {
            modalTitle.textContent = '팝업 생성';
            form.reset();
            this.clearImagePreview();

            document.getElementById('popupWidth').value = 400;
            document.getElementById('popupHeight').value = 300;
            document.getElementById('popupBgColor').value = '#ffffff';
            document.getElementById('popupStatus').value = 'ACTIVE';
            document.getElementById('popupDontShowDays').value = 7;
        }

        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.field-error').forEach(el => el.remove());

        this.elements.popupModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    populateForm(popup) {
        document.getElementById('popupId').value = popup.id || '';
        document.getElementById('popupTitle').value = popup.title || '';
        document.getElementById('popupContent').value = popup.content || '';
        document.getElementById('popupLinkUrl').value = popup.link_url || '';
        document.getElementById('popupStartDate').value = popup.start_date ? popup.start_date.split('T')[0] : '';
        document.getElementById('popupEndDate').value = popup.end_date ? popup.end_date.split('T')[0] : '';
        document.getElementById('popupWidth').value = popup.width || 400;
        document.getElementById('popupHeight').value = popup.height || 300;
        document.getElementById('popupBgColor').value = popup.bg_color || '#ffffff';
        document.getElementById('popupStatus').value = popup.status || 'ACTIVE';
        document.getElementById('popupDontShowDays').value = popup.dont_show_days || 7;

        if (popup.image_url) {
            this.showImagePreview(popup.image_url);
        } else {
            this.clearImagePreview();
        }

        const targetPages = popup.target_pages || [];
        document.querySelectorAll('input[name="target_pages"]').forEach(cb => {
            cb.checked = targetPages.includes(cb.value);
        });
    }

    closePopupModal() {
        if (this.elements.popupModal) {
            this.elements.popupModal.style.display = 'none';
        }
        document.body.style.overflow = '';
        this.currentPopupId = null;
        this.uploadedImageFile = null;

        if (this.elements.popupForm) {
            this.elements.popupForm.reset();
        }
        this.clearImagePreview();

        if (this.elements.popupPreview) {
            this.elements.popupPreview.style.display = 'none';
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('이미지 파일만 업로드 가능합니다.', 'warning');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('파일 크기는 5MB 이하여야 합니다.', 'warning');
            return;
        }

        this.uploadedImageFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageUrl) {
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('imagePreview');

        if (previewContainer && previewImg) {
            previewImg.src = imageUrl;
            previewContainer.style.display = 'block';
        }
    }

    clearImagePreview() {
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('imagePreview');

        if (previewContainer && previewImg) {
            previewImg.src = '';
            previewContainer.style.display = 'none';
        }

        const fileInput = document.getElementById('popupImageInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    async savePopup() {
        if (!this.validateForm()) {
            showToast('필수 입력 항목을 확인해주세요.', 'warning');
            return;
        }

        const formData = new FormData();

        formData.append('title', document.getElementById('popupTitle').value.trim());
        formData.append('content', document.getElementById('popupContent').value.trim());
        formData.append('link_url', document.getElementById('popupLinkUrl').value.trim());
        formData.append('start_date', document.getElementById('popupStartDate').value);
        formData.append('end_date', document.getElementById('popupEndDate').value);
        formData.append('width', document.getElementById('popupWidth').value);
        formData.append('height', document.getElementById('popupHeight').value);
        formData.append('bg_color', document.getElementById('popupBgColor').value);
        formData.append('status', document.getElementById('popupStatus').value);
        formData.append('dont_show_days', document.getElementById('popupDontShowDays').value);

        const targetPages = [];
        document.querySelectorAll('input[name="target_pages"]:checked').forEach(cb => {
            targetPages.push(cb.value);
        });
        formData.append('target_pages', JSON.stringify(targetPages));

        if (this.uploadedImageFile) {
            formData.append('image', this.uploadedImageFile);
        }

        try {
            const loadingOverlay = document.getElementById('adminLoadingOverlay');
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            if (this.currentPopupId) {
                await popupManagementApi.updatePopup(this.currentPopupId, formData);
                showToast('팝업이 성공적으로 수정되었습니다.', 'success');
            } else {
                await popupManagementApi.createPopup(formData);
                showToast('팝업이 성공적으로 생성되었습니다.', 'success');
            }

            this.closePopupModal();
            this.loadPopups();
        } catch (error) {
            showToast('저장 실패: ' + error.message, 'error');
        } finally {
            const loadingOverlay = document.getElementById('adminLoadingOverlay');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }

    async deletePopup(popupId) {
        if (!confirm('정말로 이 팝업을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const loadingOverlay = document.getElementById('adminLoadingOverlay');
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            await popupManagementApi.deletePopup(popupId);
            showToast('팝업이 성공적으로 삭제되었습니다.', 'success');
            this.loadPopups();
        } catch (error) {
            showToast('삭제 실패: ' + error.message, 'error');
        } finally {
            const loadingOverlay = document.getElementById('adminLoadingOverlay');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }

    previewPopup() {
        const title = document.getElementById('popupTitle').value;
        const content = document.getElementById('popupContent').value;
        const width = parseInt(document.getElementById('popupWidth').value) || 400;
        const height = parseInt(document.getElementById('popupHeight').value) || 300;
        const bgColor = document.getElementById('popupBgColor').value || '#ffffff';

        if (!title && !content) {
            showToast('제목 또는 내용을 입력해주세요.', 'warning');
            return;
        }

        const previewContainer = document.getElementById('popupPreviewContainer');
        if (previewContainer) {
            previewContainer.innerHTML = '<div style="width: ' + width + 'px; height: ' + height + 'px; background: ' + bgColor + '; border: 1px solid #ddd; border-radius: 8px; padding: 20px; overflow: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"><h3 style="margin-top: 0; margin-bottom: 15px;">' + title + '</h3><div style="white-space: pre-wrap;">' + content + '</div></div>';
            previewContainer.style.display = 'block';
        }
    }

    async previewPopupById(popupId) {
        try {
            const popup = await popupManagementApi.getPopup(popupId);
            const previewContainer = document.getElementById('popupPreviewContainer');
            if (previewContainer) {
                const imageHtml = popup.image_url ? '<img src="' + popup.image_url + '" style="max-width: 100%; margin-bottom: 15px;"><br>' : '';
                const linkHtml = popup.link_url ? '<br><a href="' + popup.link_url + '" target="_blank">자세히 보기</a>' : '';
                previewContainer.innerHTML = '<div style="width: ' + (popup.width || 400) + 'px; height: ' + (popup.height || 300) + 'px; background: ' + (popup.bg_color || '#ffffff') + '; border: 1px solid #ddd; border-radius: 8px; padding: 20px; overflow: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">' + imageHtml + '<h3 style="margin-top: 0; margin-bottom: 15px;">' + popup.title + '</h3><div style="white-space: pre-wrap;">' + popup.content + '</div>' + linkHtml + '</div>';
                previewContainer.style.display = 'block';
            }
        } catch (error) {
            showToast('미리보기 로드 실패: ' + error.message, 'error');
        }
    }
}

export const popupManagementTab = new PopupManagementTab();
