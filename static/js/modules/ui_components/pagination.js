



const paginationInstances = new Map();


function renderPage(id) {
    const state = paginationInstances.get(id);
    if (!state || !state.fullData) return;


    state.filteredData = state.fullData;
    state.totalItems = state.filteredData.length;


    if (state.filteredData.length === 0) {
        if (state.renderTableCallback) {
            state.renderTableCallback([]);
        }
        if (state.paginationElement) {
            state.paginationElement.innerHTML = '<span class="ml-4 text-sm text-gray-600">데이터가 없습니다.</span>';
        }
        if (state.totalCountElement) {
            state.totalCountElement.textContent = `총 0개`;
        }
        return;
    }
    

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const pageData = state.filteredData.slice(startIndex, startIndex + state.pageSize);
    

    if (state.renderTableCallback) {
        state.renderTableCallback(pageData);
    }
    

    if (state.totalCountElement) {
        state.totalCountElement.textContent = `총 ${state.totalItems}개`;
    }
    

    renderPaginationControls(id);
}


function renderPaginationControls(id) {
    const state = paginationInstances.get(id);
    if (!state || !state.paginationElement) return;

    const totalPages = Math.ceil(state.totalItems / state.pageSize);
    if (totalPages <= 1) {
        state.paginationElement.innerHTML = '';
        return;
    }

    let html = '';
    const maxVisiblePages = 5;
    const currentPage = state.currentPage;
    const idPrefix = state.paginationId;


    if (totalPages > maxVisiblePages) {
        html += `<button class="px-3 py-1 mx-1 border rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}" ${currentPage === 1 ? 'disabled' : ''} id="${idPrefix}-firstPage">처음</button>`;
    }
    html += `<button class="px-3 py-1 mx-1 border rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}" ${currentPage === 1 ? 'disabled' : ''} id="${idPrefix}-prevPage">이전</button>`;


    const pages = [];
    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 3) {
            start = 2;
            end = 4;
        } else if (currentPage >= totalPages - 2) {
            start = totalPages - 3;
            end = totalPages - 1;
        }

        if (start > 2) {
            pages.push('...');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push('...');
        }
        pages.push(totalPages);
    }

    pages.forEach(page => {
        if (page === '...') {
            html += `<span class="px-3 py-1 mx-1">...</span>`;
        } else {
            html += `<button class="px-3 py-1 mx-1 border rounded ${page === currentPage ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}" data-page="${page}">${page}</button>`;
        }
    });


    html += `<button class="px-3 py-1 mx-1 border rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}" ${currentPage === totalPages ? 'disabled' : ''} id="${idPrefix}-nextPage">다음</button>`;
    if (totalPages > maxVisiblePages) {
        html += `<button class="px-3 py-1 mx-1 border rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}" ${currentPage === totalPages ? 'disabled' : ''} id="${idPrefix}-lastPage">마지막</button>`;
    }

    state.paginationElement.innerHTML = html;


    addPaginationEventListeners(id, totalPages);
}


function addPaginationEventListeners(id, totalPages) {
    const state = paginationInstances.get(id);
    if (!state || !state.paginationElement) return;

    const idPrefix = state.paginationId;

    const firstPageButton = state.paginationElement.querySelector(`#${idPrefix}-firstPage`);
    if (firstPageButton) {
        firstPageButton.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage = 1;
                renderPage(id);
            }
        });
    }

    state.paginationElement.querySelector(`#${idPrefix}-prevPage`)?.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderPage(id);
        }
    });

    state.paginationElement.querySelector(`#${idPrefix}-nextPage`)?.addEventListener('click', () => {
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderPage(id);
        }
    });

    const lastPageButton = state.paginationElement.querySelector(`#${idPrefix}-lastPage`);
    if (lastPageButton) {
        lastPageButton.addEventListener('click', () => {
            if (state.currentPage < totalPages) {
                state.currentPage = totalPages;
                renderPage(id);
            }
        });
    }

    state.paginationElement.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentPage = parseInt(btn.dataset.page);
            renderPage(id);
        });
    });
}


export function initPagination({
    fullData,
    pageSize = 5,
    renderTableCallback,
    paginationId,
    pageSizeId,
    searchId,
    totalCountId,
}) {
    const state = {
        currentPage: 1,
        pageSize: pageSize,
        totalItems: 0,

        fullData: fullData || [],
        renderTableCallback: renderTableCallback,
        paginationId: paginationId,
        paginationElement: document.getElementById(paginationId),
        pageSizeElement: document.getElementById(pageSizeId),
        totalCountElement: totalCountId ? document.getElementById(totalCountId) : null,
    };

    paginationInstances.set(paginationId, state);


    if (state.pageSizeElement) {
        state.pageSizeElement.value = state.pageSize;

        state.pageSizeElement.replaceWith(state.pageSizeElement.cloneNode(true));
        state.pageSizeElement = document.getElementById(pageSizeId);
        state.pageSizeElement.addEventListener('change', (e) => {
            state.pageSize = parseInt(e.target.value);
            state.currentPage = 1;
            renderPage(paginationId);
        });
    }



    renderPage(paginationId);
}


export function updatePaginationData(id, newData) {
    const state = paginationInstances.get(id);
    if (!state) {

        return;
    }
    state.fullData = newData;
    state.currentPage = 1;

    renderPage(id);
}
