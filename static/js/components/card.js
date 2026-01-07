/**
 * MSYS UI 표준화 - 카드 컴포넌트 JavaScript
 * 작성일: 2025-12-23
 * 버전: 1.0
 */

/**
 * 표준 카드 컴포넌트 클래스
 * 접을 수 있는 카드의 토글 기능을 제공합니다.
 */
export class CardComponent {
    constructor(element) {
        this.element = element;
        this.header = element.querySelector('.card-header');
        this.content = element.querySelector('.card-content');
        this.toggle = element.querySelector('.card-toggle');

        this.init();
    }

    init() {
        if (this.toggle && this.content) {
            this.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleContent();
            });

            // 헤더 전체 클릭으로도 토글 가능하도록 설정
            if (this.header) {
                this.header.style.cursor = 'pointer';
                this.header.addEventListener('click', (e) => {
                    // 토글 버튼이 아닌 헤더 영역 클릭시에만 토글
                    if (e.target === this.header || e.target === this.header.querySelector('.card-title')) {
                        this.toggleContent();
                    }
                });
            }
        }
    }

    toggleContent() {
        if (!this.content) return;

        const isCollapsed = this.content.classList.contains('collapsed');

        if (isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    expand() {
        if (!this.content || !this.toggle) return;

        this.content.classList.remove('collapsed');
        this.toggle.textContent = '▼';
        this.toggle.setAttribute('aria-expanded', 'true');

        // 부드러운 애니메이션 효과
        this.content.style.maxHeight = this.content.scrollHeight + 'px';
        setTimeout(() => {
            this.content.style.maxHeight = 'none';
        }, 300);
    }

    collapse() {
        if (!this.content || !this.toggle) return;

        this.content.style.maxHeight = this.content.scrollHeight + 'px';
        setTimeout(() => {
            this.content.classList.add('collapsed');
            this.content.style.maxHeight = '0';
            this.toggle.textContent = '▶';
            this.toggle.setAttribute('aria-expanded', 'false');
        }, 10);
    }

    /**
     * 카드의 접힘/펼침 상태를 반환합니다.
     */
    isCollapsed() {
        return this.content && this.content.classList.contains('collapsed');
    }

    /**
     * 카드를 강제로 펼칩니다.
     */
    expandForced() {
        if (this.content && this.content.classList.contains('collapsed')) {
            this.expand();
        }
    }

    /**
     * 카드를 강제로 접습니다.
     */
    collapseForced() {
        if (this.content && !this.content.classList.contains('collapsed')) {
            this.collapse();
        }
    }
}

/**
 * 모든 collapsible 카드를 자동으로 초기화합니다.
 * DOM이 로드된 후에 호출되어야 합니다.
 */
export function initCollapsibleCards() {
    const cards = document.querySelectorAll('.card-collapsible');

    cards.forEach(cardElement => {
        // 이미 초기화된 카드가 아닌 경우에만 초기화
        if (!cardElement._cardComponent) {
            cardElement._cardComponent = new CardComponent(cardElement);
        }
    });

    console.log(`Initialized ${cards.length} collapsible cards`);
}

/**
 * 특정 카드를 가져옵니다.
 * @param {string|Element} selector - 카드 선택자 또는 DOM 요소
 * @returns {CardComponent|null} 카드 컴포넌트 인스턴스
 */
export function getCard(selector) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;

    if (element && element._cardComponent) {
        return element._cardComponent;
    }

    return null;
}

/**
 * 모든 카드를 펼칩니다.
 */
export function expandAllCards() {
    const cards = document.querySelectorAll('.card-collapsible');
    cards.forEach(card => {
        if (card._cardComponent) {
            card._cardComponent.expandForced();
        }
    });
}

/**
 * 모든 카드를 접습니다.
 */
export function collapseAllCards() {
    const cards = document.querySelectorAll('.card-collapsible');
    cards.forEach(card => {
        if (card._cardComponent) {
            card._cardComponent.collapseForced();
        }
    });
}

// DOM이 로드되면 자동으로 카드들을 초기화
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initCollapsibleCards);

    // 동적으로 추가된 카드들을 위해 MutationObserver 설정 (선택사항)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 새로 추가된 카드들을 초기화
                    if (node.classList && node.classList.contains('card-collapsible')) {
                        if (!node._cardComponent) {
                            node._cardComponent = new CardComponent(node);
                        }
                    }

                    // 하위 요소 중 카드들을 찾아 초기화
                    const cards = node.querySelectorAll ? node.querySelectorAll('.card-collapsible') : [];
                    cards.forEach(card => {
                        if (!card._cardComponent) {
                            card._cardComponent = new CardComponent(card);
                        }
                    });
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
