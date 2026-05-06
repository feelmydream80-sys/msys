


function getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '80px';
        container.style.right = '20px';
        container.style.zIndex = '2000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
    return container;
}


export function showToast(message, category = 'info', duration = 5000) {
    const container = getOrCreateToastContainer();

    const toast = document.createElement('div');
    toast.textContent = message;


    toast.style.padding = '12px 20px';
    toast.style.color = 'white';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.minWidth = '250px';
    toast.style.maxWidth = '400px';
    toast.style.wordBreak = 'break-all';


    let bgColor;
    switch (category) {
        case 'success':
            bgColor = '#28a745';
            break;
        case 'warning':
            bgColor = '#ffc107';
            toast.style.color = '#333';
            break;
        case 'error':
            bgColor = '#dc3545';
            break;
        default:
            bgColor = '#17a2b8';
            break;
    }
    toast.style.backgroundColor = bgColor;

    container.appendChild(toast);


    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);


    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}


function initializeFlashedMessages() {
    const flashMessagesElement = document.getElementById('flash-messages-data');
    if (flashMessagesElement) {
        try {
            const messages = JSON.parse(flashMessagesElement.textContent || '[]');
            messages.forEach(msg => {

                showToast(msg[1], msg[0]);
            });
        } catch (error) {

        }
    }
}


document.addEventListener('DOMContentLoaded', initializeFlashedMessages);


window.showToast = showToast;

