


const MAPPABLE_FIELDS = {
    spec: [
        { value: 'data_name', text: '데이터 명칭' },
        { value: 'description', text: '상세 설명' },
        { value: 'provider', text: '제공 기관' },
        { value: 'keywords', text: '키워드' },
        { value: 'api_url', text: 'API URL' },
        { value: 'reference_doc_url', text: '참고 문서 URL' }
    ],
    params: [
        { value: 'name_ko', text: '파라미터 국문명' },
        { value: 'name_en', text: '파라미터 영문명' },
        { value: 'description', text: '파라미터 설명' },
        { value: 'is_required', text: '필수 여부' },
    ]
};


function createMappingDropdown(id, options) {
    const select = document.createElement('select');
    select.id = id;
    select.className = 'mapping-select border rounded-md p-1 text-sm';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- 필드 선택 --';
    select.appendChild(defaultOption);

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
    });
    return select;
}


function renderAnalysisResult(data, container) {
    container.innerHTML = '';

    const hasHeadings = data.headings && data.headings.length > 0;
    const hasTables = data.tables && data.tables.length > 0;

    if (!hasHeadings && !hasTables) {
        return false;
    }


    if (hasHeadings) {
        const section = document.createElement('div');
        section.className = 'mb-4 p-4 border rounded bg-gray-50';
        section.innerHTML = '<h3 class="font-semibold mb-2 text-lg text-gray-700">텍스트 후보</h3>';
        data.headings.forEach((h, i) => {
            const id = `heading-${i}`;
            const div = document.createElement('div');
            div.className = 'flex items-center mb-2';
            const select = createMappingDropdown(`map-${id}`, MAPPABLE_FIELDS.spec);
            div.innerHTML = `<span class="flex-grow p-2 bg-white rounded border border-gray-200">${h.text}</span>`;
            div.prepend(select);
            select.classList.add('mr-3');
            section.appendChild(div);
        });
        container.appendChild(section);
    }


    if (hasTables) {
        data.tables.forEach((table, i) => {
            const section = document.createElement('div');
            section.className = 'mb-4 p-4 border rounded bg-gray-50';
            section.dataset.tableIndex = i;


            const radioContainer = document.createElement('div');
            radioContainer.className = 'mb-2';
            radioContainer.innerHTML = `
                <h4 class="font-semibold text-md text-gray-600 mb-1">테이블 ${i + 1} 종류 선택</h4>
                <label class="mr-4"><input type="radio" name="param-type-${i}" value="request" checked> 요청 파라미터</label>
                <label><input type="radio" name="param-type-${i}" value="response"> 응답 파라미터</label>
            `;
            section.appendChild(radioContainer);
            
            const tableContainer = document.createElement('div');
            tableContainer.className = 'overflow-x-auto';
            
            const htmlTable = document.createElement('table');
            htmlTable.className = 'min-w-full bg-white border text-sm';
            

            const thead = document.createElement('thead');
            thead.className = 'bg-gray-100';
            let tr = document.createElement('tr');
            table.headers.forEach((header, colIndex) => {
                const th = document.createElement('th');
                th.className = 'py-2 px-3 text-left font-semibold text-gray-600';
                const select = createMappingDropdown(`map-table-${i}-header-${colIndex}`, MAPPABLE_FIELDS.params);
                th.appendChild(select);
                th.append(` (${header})`);
                tr.appendChild(th);
            });
            thead.appendChild(tr);
            htmlTable.appendChild(thead);


            const tbody = document.createElement('tbody');
            table.rows.forEach(row => {
                tr = document.createElement('tr');
                tr.className = 'border-b';
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.className = 'py-2 px-3';
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            htmlTable.appendChild(tbody);
            
            tableContainer.appendChild(htmlTable);
            section.appendChild(tableContainer);
            container.appendChild(section);
        });
    }
    return true;
}


function gatherMappedData(container) {
    const spec = {};
    const params = [];


    const concatenatableFields = ['description', 'keywords'];

    container.querySelectorAll('.flex.items-center').forEach(div => {
        const select = div.querySelector('select');
        const value = select.value;
        if (value) {
            const text = div.querySelector('span').textContent;
            

            if (concatenatableFields.includes(value) && spec[value]) {
                spec[value] += '\n' + text;
            } else {

                spec[value] = text;
            }
        }
    });


    container.querySelectorAll('div[data-table-index]').forEach(section => {
        const tableIndex = section.dataset.tableIndex;
        const table = section.querySelector('table');
        if (!table) return;


        const paramType = section.querySelector(`input[name="param-type-${tableIndex}"]:checked`).value || 'request';

        const headerSelects = table.querySelectorAll('thead th select');
        const mappingConfig = [];
        headerSelects.forEach((select, colIndex) => {
            if (select.value) {
                mappingConfig.push({ col: colIndex, field: select.value });
            }
        });

        if (mappingConfig.length === 0) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const param = { param_type: paramType };
            let hasData = false;
            mappingConfig.forEach(config => {
                if (cells[config.col]) {
                    param[config.field] = cells[config.col].textContent;
                    hasData = true;
                }
            });
            if (hasData) {
                params.push(param);
            }
        });
    });

    if (Object.keys(spec).length === 0 && params.length === 0) {
        alert('매핑된 데이터가 없습니다. 필드를 선택해주세요.');
        return null;
    }

    return { spec, params };
}



export function initUrlMapper(onSave) {

    const contentInput = document.getElementById('paste-content-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const statusEl = document.getElementById('analyze-status');
    

    const modal = document.getElementById('url-analysis-modal');
    const modalContent = document.getElementById('analysis-modal-content');
    const closeModalBtn = document.getElementById('close-analysis-modal-btn');
    const saveMappedBtn = document.getElementById('save-mapped-data-btn');

    if (!modal || !analyzeBtn || !contentInput) {

        return;
    }

    const openModal = () => modal.classList.remove('hidden');
    const closeModal = () => modal.classList.add('hidden');

    analyzeBtn.addEventListener('click', async () => {
        const content = contentInput.value.trim();
        if (!content) {
            alert('분석할 내용을 붙여넣어 주세요.');
            return;
        }

        analyzeBtn.disabled = true;
        statusEl.textContent = '페이지 분석 중...';
        statusEl.className = 'text-gray-500 text-sm';

        try {
            const response = await fetch('/api/analyze-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '분석에 실패했습니다.');
            }

            const data = await response.json();
            const dataWasRendered = renderAnalysisResult(data, modalContent);

            if (dataWasRendered) {
                statusEl.textContent = '분석 완료. 팝업에서 사용할 데이터를 선택하고 필드를 매핑하세요.';
                statusEl.className = 'text-green-500 text-sm';
                openModal();
            } else {
                statusEl.textContent = '분석은 성공했으나, 페이지에서 추출할 수 있는 데이터 후보를 찾지 못했습니다.';
                statusEl.className = 'text-orange-500 text-sm';
                alert('분석 결과, 페이지에서 추출할 수 있는 데이터 후보를 찾지 못했습니다. 다른 URL을 시도해 보세요.');
            }

        } catch (error) {

            statusEl.textContent = `분석 실패: ${error.message}`;
            statusEl.className = 'text-red-500 text-sm';
            alert(`분석에 실패했습니다: ${error.message}`);
        } finally {
            analyzeBtn.disabled = false;
        }
    });


    saveMappedBtn.addEventListener('click', () => {
        const mappedData = gatherMappedData(modalContent);
        if (mappedData) {
            onSave(mappedData);
            closeModal();
            statusEl.textContent = '명세서 팝업에 데이터를 채웠습니다. 내용을 확인하고 저장하세요.';
            statusEl.className = 'text-green-500 text-sm';
        }
    });


    closeModalBtn.addEventListener('click', closeModal);
}
