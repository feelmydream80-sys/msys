


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


            if (this.header) {
                this.header.style.cursor = 'pointer';
                this.header.addEventListener('click', (e) => {

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

    
    isCollapsed() {
        return this.content && this.content.classList.contains('collapsed');
    }

    
    expandForced() {
        if (this.content && this.content.classList.contains('collapsed')) {
            this.expand();
        }
    }

    
    collapseForced() {
        if (this.content && !this.content.classList.contains('collapsed')) {
            this.collapse();
        }
    }
}


export function initCollapsibleCards() {
    const cards = document.querySelectorAll('.card-collapsible');

    cards.forEach(cardElement => {

        if (!cardElement._cardComponent) {
            cardElement._cardComponent = new CardComponent(cardElement);
        }
    });

}


export function getCard(selector) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;

    if (element && element._cardComponent) {
        return element._cardComponent;
    }

    return null;
}


export function expandAllCards() {
    const cards = document.querySelectorAll('.card-collapsible');
    cards.forEach(card => {
        if (card._cardComponent) {
            card._cardComponent.expandForced();
        }
    });
}


export function collapseAllCards() {
    const cards = document.querySelectorAll('.card-collapsible');
    cards.forEach(card => {
        if (card._cardComponent) {
            card._cardComponent.collapseForced();
        }
    });
}


if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initCollapsibleCards);


    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {

                    if (node.classList && node.classList.contains('card-collapsible')) {
                        if (!node._cardComponent) {
                            node._cardComponent = new CardComponent(node);
                        }
                    }


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
