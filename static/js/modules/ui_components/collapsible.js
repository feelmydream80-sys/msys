




function initializeIndividualCards() {
    const cards = document.querySelectorAll('.collapsible-card');
    cards.forEach(initSingleCollapsibleCard);
}


function toggleCardState(card) {
    const content = card.querySelector('.card-content');
    const icon = card.querySelector('.card-header span');
    if (content) {
        const isCollapsed = content.classList.toggle('hidden');
        if (card.id) {
            localStorage.setItem(card.id, isCollapsed);
        }
        if (icon) {
            icon.classList.toggle('rotate-180', isCollapsed);
        }
        

        const event = new CustomEvent('cardToggled', {
            bubbles: true,
            detail: { card, isCollapsed }
        });
        card.dispatchEvent(event);
    }
}



function expandAllCards() {
    const cards = document.querySelectorAll('.collapsible-card');
    cards.forEach(card => {
        const content = card.querySelector('.card-content');
        if (content && content.classList.contains('hidden')) {
            toggleCardState(card);
        }
    });
}


function collapseAllCards() {
    const cards = document.querySelectorAll('.collapsible-card');
    cards.forEach(card => {
        const content = card.querySelector('.card-content');
        if (content && !content.classList.contains('hidden')) {
            toggleCardState(card);
        }
    });
}


function initializeGlobalControls() {
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');

    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', expandAllCards);
    }
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', collapseAllCards);
    }
}



export function initSingleCollapsibleCard(card) {
    if (!card) return;


    if (card.id) {
        const isCollapsed = localStorage.getItem(card.id) === 'true';
        const content = card.querySelector('.card-content');
        const icon = card.querySelector('.card-header span');
        if (content) {
            content.classList.toggle('hidden', isCollapsed);
            if (icon) {
                icon.classList.toggle('rotate-180', isCollapsed);
            }
        }
    }


    const header = card.querySelector('.card-header');
    if (header && !header.dataset.collapsibleInitialized) {
        header.addEventListener('click', () => {
            toggleCardState(card);
        });
        header.dataset.collapsibleInitialized = 'true';
    }
}


export function initCollapsibleFeatures() {
    initializeIndividualCards();
    initializeGlobalControls();
}
