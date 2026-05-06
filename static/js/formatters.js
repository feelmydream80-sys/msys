



function formatNumber(number, decimals = 0) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '0';
    }
    
    return number.toLocaleString('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}


function formatDate(date, format = 'YYYY-MM-DD') {

    if (typeof date === 'string') {

        if (date.includes('+09:00')) {
            return date.replace('+09:00', '').trim();
        }

        if (date.match(/\d{4}-\d{2}-\d{2}/)) {
            return date;
        }

        if (date.includes('GMT') || date.includes('UTC')) {
            return formatDate(new Date(date), format);
        }

        return date;
    }
    
    let d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }
    

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}


function formatPercentage(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0%';
    }
    
    return (value * 100).toFixed(decimals) + '%';
}


function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export { 
    formatNumber, 
    formatDate, 
    formatPercentage, 
    formatFileSize 
};