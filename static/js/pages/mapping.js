export function init() {
    const unmappedTableBody = document.querySelector('#unmapped-columns-table tbody');
    const mappingsTableBody = document.querySelector('#mappings-table tbody');
    const modal = $('#mapping-modal');
    const modalLabel = document.getElementById('mapping-modal-label');
    const saveButton = document.getElementById('save-mapping-btn');
    const addButton = document.getElementById('add-mapping-btn');
    const reloadUnmappedButton = document.getElementById('reload-unmapped-btn');
    const form = document.getElementById('mapping-form');


    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
    }


    async function loadUnmappedColumns() {
        try {
            const response = await fetch('/mapping/api/unmapped');
            if (!response.ok) throw new Error('매핑되지 않은 컬럼 로드 실패');
            const columns = await response.json();
            
            unmappedTableBody.innerHTML = '';
            if (columns.length === 0) {
                unmappedTableBody.innerHTML = '<tr><td colspan="3" class="text-center">매핑되지 않은 신규 컬럼이 없습니다.</td></tr>';
            } else {
                columns.forEach(col => {
                    const row = `<tr>
                        <td>${col.table_name}</td>
                        <td>${col.column_name}</td>
                        <td>
                            <button class="btn btn-sm btn-success add-from-unmapped-btn" data-table="${col.table_name}" data-column="${col.column_name}">매핑 추가</button>
                        </td>
                    </tr>`;
                    unmappedTableBody.insertAdjacentHTML('beforeend', row);
                });
            }
        } catch (error) {

            unmappedTableBody.innerHTML = '<tr><td colspan="3" class="text-center">데이터 로드 중 오류 발생</td></tr>';
        }
    }


    async function loadMappings() {
        try {
            const response = await fetch('/mapping/api/all');
            if (!response.ok) throw new Error('매핑 정보 로드 실패');
            const mappings = await response.json();

            mappingsTableBody.innerHTML = '';
            mappings.forEach(m => {
                const row = `<tr>
                    <td>${m.mapp_id}</td>
                    <td>${m.bf_tbl_nm || ''}</td>
                    <td>${m.bf_col_nm || ''}</td>
                    <td>${m.new_tbl_nm}</td>
                    <td>${m.new_col_nm}</td>
                    <td>${m.expl || ''}</td>
                    <td>${formatDate(m.upd_dt)}</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-btn" data-id="${m.mapp_id}">수정</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${m.mapp_id}">삭제</button>
                    </td>
                </tr>`;
                mappingsTableBody.insertAdjacentHTML('beforeend', row);
            });
        } catch (error) {

            mappingsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">데이터 로드 중 오류 발생</td></tr>';
        }
    }


    function openModal(data = {}) {
        form.reset();
        document.getElementById('mapp-id').value = data.mapp_id || '';
        document.getElementById('bf-tbl-nm').value = data.bf_tbl_nm || '';
        document.getElementById('bf-col-nm').value = data.bf_col_nm || '';
        document.getElementById('new-tbl-nm').value = data.new_tbl_nm || '';
        document.getElementById('new-col-nm').value = data.new_col_nm || '';
        document.getElementById('expl').value = data.expl || '';
        
        modalLabel.textContent = data.mapp_id ? '매핑 수정' : '신규 매핑 추가';
        modal.modal('show');
    }


    async function handleSave() {
        const mappId = document.getElementById('mapp-id').value;
        const data = {
            bf_tbl_nm: document.getElementById('bf-tbl-nm').value,
            bf_col_nm: document.getElementById('bf-col-nm').value,
            new_tbl_nm: document.getElementById('new-tbl-nm').value,
            new_col_nm: document.getElementById('new-col-nm').value,
            expl: document.getElementById('expl').value,
        };

        if (!data.new_tbl_nm || !data.new_col_nm) {
            alert('새 테이블명과 새 컬럼명은 필수 항목입니다.');
            return;
        }

        const url = mappId ? `/mapping/api/update` : '/mapping/api/add';
        const method = 'POST';
        if(mappId) data.mapp_id = mappId;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '저장 실패');
            }
            
            modal.modal('hide');
            loadAllData();
        } catch (error) {
            alert(`오류: ${error.message}`);
        }
    }


    async function handleDelete(mappId) {
        if (!confirm(`정말로 이 매핑(ID: ${mappId})을 삭제하시겠습니까?`)) return;

        try {
            const response = await fetch(`/mapping/api/delete/${mappId}`, { method: 'DELETE' });
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || '삭제 실패');
            }
            loadAllData();
        } catch (error) {
            alert(`오류: ${error.message}`);
        }
    }
    

    addButton.addEventListener('click', () => openModal());
    reloadUnmappedButton.addEventListener('click', loadUnmappedColumns);
    saveButton.addEventListener('click', handleSave);

    unmappedTableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-from-unmapped-btn')) {
            const button = e.target;
            openModal({
                new_tbl_nm: button.dataset.table,
                new_col_nm: button.dataset.column,
            });
        }
    });

    mappingsTableBody.addEventListener('click', async function(e) {
        const button = e.target;
        const mappId = button.dataset.id;

        if (button.classList.contains('edit-btn')) {

            const response = await fetch('/mapping/api/all');
            const mappings = await response.json();
            const mappingData = mappings.find(m => m.mapp_id == mappId);
            if(mappingData) openModal(mappingData);

        } else if (button.classList.contains('delete-btn')) {
            handleDelete(mappId);
        }
    });


    function loadAllData() {
        loadUnmappedColumns();
        loadMappings();
    }


    loadAllData();
}
