



function debugLog(...args) {

    const DEBUG_MODE = true;
    if (DEBUG_MODE) {

    }
}


function showToast(message, category = 'info') {

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
    }, 5000);
}


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


let activeColorInput = null;

function setActiveColorInput(inputElement) {

    if (activeColorInput && activeColorInput.parentElement.parentElement) {
        activeColorInput.parentElement.parentElement.classList.remove('ring-2', 'ring-blue-500', 'rounded-md');
    }
    
    activeColorInput = inputElement;


    if (activeColorInput && activeColorInput.parentElement.parentElement) {
        activeColorInput.parentElement.parentElement.classList.add('ring-2', 'ring-blue-500', 'rounded-md');
    }
}


function createStatusSettingRow(prefix, label, selectedIconId, bgColorValue, textColorValue, allIcons, isIconOnly = false) {
    const iconOptions = allIcons
        .filter(icon => icon.icon_dsp_yn === true)
        .map(icon => `<option value="${icon.icon_id}" ${icon.icon_id === selectedIconId ? 'selected' : ''}>${icon.icon_cd}</option>`)
        .join('');

    if (isIconOnly) {
        return `
            <div class="form-group">
                <label for="${prefix}_icon_id" class="block text-sm font-medium text-gray-700">${label}</label>
                <select id="${prefix}_icon_id" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">선택 안 함</option>
                    ${iconOptions}
                </select>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 rounded-md border bg-gray-50">
            <div class="font-medium text-gray-800">${label}</div>
            <div class="form-group">
                <label for="${prefix}_icon_id" class="block text-xs font-medium text-gray-600 mb-1">아이콘</label>
                <select id="${prefix}_icon_id" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">선택 안 함</option>
                    ${iconOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="${prefix}_bg_colr" class="block text-xs font-medium text-gray-600 mb-1">배경색</label>
                <div class="color-input-wrapper">
                     <span class="color-preview"></span>
                    <input type="color" id="${prefix}_bg_colr" value="${bgColorValue || '#FFFFFF'}" class="w-full h-10 p-1 border border-gray-300 rounded-md shadow-sm">
                </div>
            </div>
            <div class="form-group">
                <label for="${prefix}_txt_colr" class="block text-xs font-medium text-gray-600 mb-1">글자색</label>
                 <div class="color-input-wrapper">
                    <span class="color-preview"></span>
                    <input type="color" id="${prefix}_txt_colr" value="${textColorValue || '#000000'}" class="w-full h-10 p-1 border border-gray-300 rounded-md shadow-sm">
                </div>
            </div>
        </div>
    `;
}


function moveSelectedItems(fromList, toList) {
    const selectedItems = Array.from(fromList.querySelectorAll('li.selected'));
    selectedItems.forEach(item => {
        item.classList.remove('selected');
        toList.appendChild(item);
    });
}


function moveAllItems(fromList, toList) {
    const allItems = Array.from(fromList.querySelectorAll('li'));
    allItems.forEach(item => {
        item.classList.remove('selected');
        toList.appendChild(item);
    });
}

export { 
    debugLog, 
    showToast, 
    setActiveColorInput, 
    createStatusSettingRow, 
    moveSelectedItems, 
    moveAllItems 
};