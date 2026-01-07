// static/js/pages/card_summary.js

let mstData = {}; // For mapping job_id to name

function getDisplayName(cd) {
    const displayMode = document.querySelector('input[name="displayMode"]:checked')?.value || 'code';

    const match = cd.match(/([^(]+)(\(.*\))?/);
    if (!match) return cd; // No match, return original

    const baseCd = match[1].trim();
    const suffix = match[2] || '';
    const name = mstData[baseCd] || '';

    if (!name) return cd; // No name found, return original

    switch (displayMode) {
        case 'name':
            return name + suffix;
        case 'both':
            return `${cd} (${name})`;
        case 'code':
        default:
            return cd;
    }
}
 
async function fetchAndRenderCardSummary() {
    // Fetch MST data for mapping if not already fetched
    if (Object.keys(mstData).length === 0) {
        try {
            const mstResponse = await fetch('/api/mst_list');
            const mstResult = await mstResponse.json();
            if (mstResult) {
                mstData = mstResult.reduce((acc, item) => {
                    acc[item.job_id] = item.cd_nm;
                    return acc;
                }, {});
            }
        } catch (e) {
            console.error("Failed to fetch MST data", e);
        }
    }

    fetch('/api/card_summary')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(summaryData => {
            const container = document.getElementById('cardContainer');
            if (!container) return; // 컨테이너가 없으면 중단

            // CSS 로딩 지연 문제에 대응하기 위해 최소 높이를 JS에서 직접 설정
            container.style.minHeight = '100px';

            container.innerHTML = ''; // 먼저 컨테이너를 비웁니다.

            if (!summaryData || Object.keys(summaryData).length === 0) {
                const noDataElement = document.createElement('div');
                noDataElement.className = 'no-data';
                noDataElement.textContent = '오늘 수집된 데이터가 없습니다.';
                container.appendChild(noDataElement);
                return;
            }
            
            const fragment = document.createDocumentFragment();

            Object.keys(summaryData).sort().forEach(cd => {
                const data = summaryData[cd];
                const totalJobs = data.success.count + data.progress.count + data.fail.count;

                if (totalJobs === 0) return;

                const card = document.createElement('div');
                card.className = 'card';

                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-title">${getDisplayName(cd)}</div>
                        <div style="font-size:0.9rem;color:#666;">총 ${totalJobs}건</div>
                    </div>

                    <div class="status-group">
                        <div class="status-item status-success">
                            <div>성공</div>
                            <div style="font-weight:600;font-size:1.1rem;">${data.success.count}</div>
                        </div>
                        <div class="status-item status-progress">
                            <div>수집중</div>
                            <div style="font-weight:600;font-size:1.1rem;">${data.progress.count}</div>
                        </div>
                        <div class="status-item status-fail">
                            <div>실패</div>
                            <div style="font-weight:600;font-size:1.1rem;">${data.fail.count}</div>
                        </div>
                    </div>

                    ${data.success.jobs.length ? `<div class="job-list"><strong>성공 Job ID:</strong> ${data.success.jobs.map(getDisplayName).join(', ')}</div>` : ''}
                    ${data.progress.jobs.length ? `<div class="job-list"><strong>수집중 Job ID:</strong> ${data.progress.jobs.map(getDisplayName).join(', ')}</div>` : ''}
                    ${data.fail.jobs.length ? `<div class="job-list"><strong>실패 Job ID:</strong> ${data.fail.jobs.map(getDisplayName).join(', ')}</div>` : ''}
                `;

                fragment.appendChild(card);
            });

            if (fragment.children.length === 0) {
                const noDataElement = document.createElement('div');
                noDataElement.className = 'no-data';
                noDataElement.textContent = '오늘 처리된 수집 데이터가 없습니다.';
                container.appendChild(noDataElement);
            } else {
                container.appendChild(fragment); // 한 번에 모든 카드를 추가합니다.
            }
        })
        .catch(error => {
            const container = document.getElementById('cardContainer');
            if (container) {
                container.innerHTML = ''; // 기존 내용 지우기
                const errorElement = document.createElement('div');
                errorElement.className = 'no-data'; // 동일한 스타일 적용
                errorElement.textContent = `데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`;
                container.appendChild(errorElement);
            }
        });
}

// 엑셀 템플릿 다운로드 버튼 이벤트 리스너
function initDownloadButton() {
    const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
    if (downloadExcelTemplateBtn) {
        downloadExcelTemplateBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/excel_template/download');
                if (!response.ok) {
                    if (response.status === 404) {
                        alert('다운로드할 카드 요약 양식이 없습니다.');
                    } else {
                        throw new Error('다운로드에 실패했습니다.');
                    }
                    return;
                }

                // 파일 다운로드 처리
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'card_summary_template.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                alert('카드 요약 양식 다운로드가 시작되었습니다.');
            } catch (error) {
                alert(error.message);
            }
        });
    }
}

/**
 * @description 카드 요약 페이지의 진입점 함수. router.js에 의해 호출됩니다.
 */
export function init() {
    // 페이지가 처음 로드될 때 데이터를 가져와 렌더링합니다.
    fetchAndRenderCardSummary();

    document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
        radio.addEventListener('change', fetchAndRenderCardSummary);
    });

    // 엑셀 템플릿 다운로드 버튼 초기화
    initDownloadButton();

    // SPA 환경에서 중복 리스너 등록을 방지하기 위해 플래그를 사용합니다.
    if (!window.cardSummaryListenerAttached) {
        document.addEventListener('visibilitychange', () => {
            // 카드 요약 페이지가 화면에 표시되고 있을 때만 데이터를 새로고침합니다.
            if (document.visibilityState === 'visible' && document.getElementById('cardContainer')) {
                fetchAndRenderCardSummary();
            }
        });
        window.cardSummaryListenerAttached = true;
    }
}
