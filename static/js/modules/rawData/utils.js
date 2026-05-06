


export function formatNumber(n) {
    if (typeof n === 'number') return n.toLocaleString();
    if (!isNaN(n) && n !== null && n !== undefined && n !== '') return Number(n).toLocaleString();
    return n;
}


export function formatNumberAbbreviated(n) {
    const num = Number(n);
    if (isNaN(num)) return n;

    if (num >= 100000) {
        return (num / 10000).toFixed(1) + '만';
    }
    return num.toLocaleString();
}


export function getStatusClass(status, errorCodeMap = {}) {

    const defaultColorMap = {
        'CD901': 'text-green-600 font-semibold',
        'CD902': 'text-red-600 font-semibold',
        'CD903': 'text-gray-500 font-semibold',
        'CD904': 'text-blue-600 font-semibold'
    };

    return defaultColorMap[status] || 'text-gray-700 font-semibold';
}


export function filterData(state) {
    const { allData, searchTerm, errorCodeMap } = state;
    const selectedJobId = document.getElementById('job-id-select').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let filtered = allData.filter(row => {
        let ok = true;
        if (selectedJobId && row.job_id !== selectedJobId) ok = false;
        if (startDate && new Date(row.start_dt) < new Date(startDate)) ok = false;
        if (endDate && new Date(row.start_dt) > new Date(endDate + 'T23:59:59')) ok = false;
        return ok;
    });
    

    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(row => {
            const statusKey = row.status ? String(row.status).trim() : '';
            const statusLabel = errorCodeMap[statusKey] ? String(errorCodeMap[statusKey]).trim() : '';

            const values = [
                row.job_id,
                statusKey,
                statusLabel,
                row.start_dt,
                row.rqs_info
            ];

            return values.some(value => {
                if (value) {
                    return String(value).toLowerCase().includes(searchLower);
                }
                return false;
            });
        });
    }
    
    return filtered;
}


export function downloadExcel(filteredData, errorCodeMap = {}) {

    if (typeof XLSX === 'undefined') {
        alert('엑셀 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }


    const statusCount = {};
    let totalSuccess = 0, totalCount = 0;
    filteredData.forEach(row => {

        let total = 0, fail = 0, success = 0;
        const match = row.rqs_info && row.rqs_info.match(/(총 요청 수|총 요청 수): (\d+), (실패|실패): (\d+)/);
        if (match) {
            total = parseInt(match[2]);
            fail = parseInt(match[4]);
            success = total - fail;
        }
        totalSuccess += success;
        totalCount += total;
        statusCount[row.status] = (statusCount[row.status] || 0) + 1;
    });
    const totalPercent = totalCount > 0 ? Math.round((totalSuccess / totalCount) * 100) : 0;


    const totalRows = filteredData.length;
    let statusSummary = `전체 성공률: ${totalSuccess}/${totalCount} (${totalPercent}%) | `;


    Object.keys(statusCount).forEach(code => {
        const count = statusCount[code] || 0;
        const percent = totalRows > 0 ? ((count / totalRows) * 100).toFixed(1) : '0.0';
        const label = errorCodeMap[code] || code;
        statusSummary += `${label} ${count}건(${percent}%)  `;
    });


    const wsData = [
        [statusSummary.trim()]
    ];
    wsData.push(['수집시작일', '수집종료일', '연결ID', '코드명', '성공/총수량', '성공여부']);
    
    filteredData.forEach(row => {
        let total = 0, fail = 0, success = 0, percent = 0;
        const match = row.rqs_info && row.rqs_info.match(/(총 요청 수|총 요청 수): (\d+), (실패|실패): (\d+)/);
        if (match) {
            total = parseInt(match[2]);
            fail = parseInt(match[4]);
            success = total - fail;
            percent = total > 0 ? Math.round((success / total) * 100) : 0;
        }
        wsData.push([
            new Date(row.start_dt) || '',
            new Date(row.end_dt) || '',
            row.con_id || '',
            row.job_id || '',
            `${success}/${total} (${percent}%)`,
            row.status || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '상세데이터');
    XLSX.writeFile(wb, '상세데이터.xlsx');
}
