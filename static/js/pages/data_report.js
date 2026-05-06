document.addEventListener('DOMContentLoaded', function() {
    const viewTypeRadios = document.querySelectorAll('input[name="view-type"]');
    const tableBody = document.getElementById('report-table-body');
    const loadingIndicator = document.getElementById('loading-indicator');

    let currentView = 'weekly';

    function fetchData(view) {
        loadingIndicator.style.display = 'block';
        tableBody.innerHTML = '';

        fetch(`/api/data-report?view=${view}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                renderTable(data);
            })
            .catch(error => {

                tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">데이터를 불러오는 데 실패했습니다.</td></tr>`;
            })
            .finally(() => {
                loadingIndicator.style.display = 'none';
            });
    }

    function renderTable(data) {
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center">해당 기간에 조회된 데이터가 없습니다.</td></tr>`;
            return;
        }


        data.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            if (a.job_id < b.job_id) return -1;
            if (a.job_id > b.job_id) return 1;
            return 0;
        });

        let rowsHtml = '';
        data.forEach(item => {
            let statusBadge = '';
            switch (item.status) {
                case '성공':
                    statusBadge = '<span class="badge badge-success">성공</span>';
                    break;
                case '실패':
                    statusBadge = '<span class="badge badge-danger">실패</span>';
                    break;
                case '수집중':
                    statusBadge = '<span class="badge badge-info">수집중</span>';
                    break;
                case '미수집':
                    statusBadge = '<span class="badge badge-warning">미수집</span>';
                    break;
                default:
                    statusBadge = `<span class="badge badge-secondary">${item.status}</span>`;
            }

            const detailsJson = JSON.stringify(item.details, null, 2);

            rowsHtml += `
                <tr>
                    <td>${item.date}</td>
                    <td>${item.job_id}</td>
                    <td>${item.schedule_time}</td>
                    <td>${statusBadge}</td>
                    <td><pre><code>${detailsJson}</code></pre></td>
                </tr>
            `;
        });
        tableBody.innerHTML = rowsHtml;
    }

    viewTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {

            document.querySelectorAll('.btn-group-toggle .btn').forEach(label => {
                label.classList.remove('active');
            });
            this.parentElement.classList.add('active');

            currentView = this.value;
            fetchData(currentView);
        });
    });


    fetchData(currentView);
});
