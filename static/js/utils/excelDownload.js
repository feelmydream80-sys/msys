

export async function downloadExcelTemplate() {
    try {
        const response = await fetch('/api/excel_template/download');

        if (!response.ok) {
            if (response.status === 404) {
                showToast('다운로드할 엑셀 템플릿이 없습니다.', 'warning');
            } else {
                throw new Error('다운로드에 실패했습니다.');
            }
            return;
        }


        const contentDisposition = response.headers.get('Content-Disposition');


        let filename = 'excel_template.xlsx';
        if (contentDisposition) {

            const filenameStarMatch = contentDisposition.match(/filename\*=([^;]+)/);
            if (filenameStarMatch) {
                const filenameStar = filenameStarMatch[1].trim();

                const parts = filenameStar.split("''");
                if (parts.length === 2) {
                    const encodedFilename = parts[1];
                    try {
                        filename = decodeURIComponent(encodedFilename);
                    } catch (e) {

                        filename = encodedFilename;
                    }
                }
            } else {

                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
        }


        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        throw error;
    }
}
