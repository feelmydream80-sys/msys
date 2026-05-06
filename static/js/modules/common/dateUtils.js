

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;


export function getKSTNow() {
    const now = new Date();

    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + KST_OFFSET_MS);
}


export function toKST(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return null;
    }
    return new Date(d.getTime() + KST_OFFSET_MS);
}


export function getLast6Months(months = 6) {
    const result = [];
    const now = getKSTNow();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    for (let i = 0; i < months; i++) {
        let month = currentMonth - i;
        let year = currentYear;

        while (month <= 0) {
            month += 12;
            year -= 1;
        }

        const shortYear = String(year).slice(2);
        const monthStr = String(month).padStart(2, '0');
        result.push(`${shortYear}.${monthStr}`);
    }

    return result;
}


export function getFirstWeekOfMonth(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay();
    return dayOfWeek === 0 ? 1 : dayOfWeek < 4 ? 1 : 2;
}


export function getWeeksPerMonthFn(months = 6) {
    const now = getKSTNow();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const result = [];
    for (let i = 0; i < months; i++) {
        let month = currentMonth - i;
        let year = currentYear;
        while (month <= 0) {
            month += 12;
            year -= 1;
        }

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();

        let weeks = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
        weeks = Math.min(5, Math.max(4, weeks));
        result.push(weeks);
    }

    while (result.length < months) {
        result.unshift(4);
    }

    return result.reverse();
}


export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


export function formatDateTime(date, format = 'YYYY-MM-DD') {

    if (typeof date === 'string') {

        if (date.includes('+09:00')) {
            return date.replace('+09:00', '');
        }

        if (date.includes('GMT') || date.includes('UTC')) {

            const dateStr = date.replace('GMT', '').replace('UTC', '').trim();

            const parts = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)\s+(\d+):(\d+):(\d+)/);
            if (parts) {
                const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
                const year = parseInt(parts[3]);
                const month = months[parts[2]];
                const day = parseInt(parts[1]);
                const hours = parseInt(parts[4]) + 9;
                const minutes = parseInt(parts[5]);
                const seconds = parseInt(parts[6]);
                

                let newDay = day;
                let newMonth = month;
                let newYear = year;
                let newHours = hours;
                
                if (hours >= 24) {
                    newHours = hours - 24;
                    newDay = day + 1;

                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    if (newDay > daysInMonth) {
                        newDay = 1;
                        newMonth = month + 1;
                        if (newMonth > 11) {
                            newMonth = 0;
                            newYear = year + 1;
                        }
                    }
                }
                
                return `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')} ${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            return date;
        }

        return date;
    }
    
    const d = toKST(date);
    
    if (!d) {
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


export function getDateRange(daysAgo) {
    const today = getKSTNow();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysAgo);

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(today)
    };
}


export function getDefaultDateRange() {
    const today = getKSTNow();

    const startDate = new Date(2024, 1, 7);

    const todayDate = formatDate(today);
    const startDateValue = formatDate(startDate);

    return { startDateValue, todayDate };
}


export function setDefaultDates() {
    const { startDateValue, todayDate } = getDefaultDateRange();

    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (startDateInput) {
        startDateInput.value = startDateValue;
    }
    if (endDateInput) {
        endDateInput.value = todayDate;
    }
}


export function setYearToDate() {
    const today = getKSTNow();
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1);

    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (startDateInput) {
        startDateInput.value = formatDate(startDate);
    }
    if (endDateInput) {
        endDateInput.value = formatDate(today);
    }
}


export function formatDBDateTime(dbDateTime) {
    if (!dbDateTime) return '';


    const parts = dbDateTime.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return '';

    const year = parts[1].slice(2);
    const month = parts[2];
    const day = parts[3];
    const hours = parts[4];
    const minutes = parts[5];

    return `${year}.${month}.${day} ${hours}:${minutes}`;
}
