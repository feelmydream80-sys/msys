





function isIntervalPattern(value, unit) {
    if (!value.startsWith('*/')) return null;
    const interval = parseInt(value.substring(2));
    if (isNaN(interval)) return null;
    
    const unitMap = {
        'minute': '분',
        'hour': '시간',
        'day': '일',
        'month': '개월',
        'dow': '주'
    };
    
    return `${interval}${unitMap[unit]}마다`;
}


export function parseCronExpression(cronExpression) {
    if (!cronExpression || cronExpression.trim() === '') {
        return '설정 없음';
    }
    
    const parts = cronExpression.trim().split(' ');
    if (parts.length < 5) {
        return '잘못된 형식';
    }
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    

    const minuteInterval = isIntervalPattern(minute, 'minute');
    const hourInterval = isIntervalPattern(hour, 'hour');
    const dayInterval = isIntervalPattern(dayOfMonth, 'day');
    const monthInterval = isIntervalPattern(month, 'month');
    const weekInterval = isIntervalPattern(dayOfWeek, 'dow');
    

    if (minuteInterval && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `${minuteInterval} 실행`;
    }
    

    if (minute !== '*' && hourInterval && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `${hourInterval} ${minute}분에 실행`;
    }
    

    if (minute !== '*' && hour !== '*' && dayInterval && month === '*' && dayOfWeek === '*') {
        return `${dayInterval} ${hour}시 ${minute}분에 실행`;
    }
    

    if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && weekInterval) {
        return `${weekInterval} ${hour}시 ${minute}분에 실행`;
    }


    if (dayOfMonth === '*' && dayOfWeek === '*') {
        if (hour === '*' && minute === '*') {
            return '매분 실행';
        } else if (hour === '*' && minute !== '*') {
            return `매시간 ${minute}분에 실행`;
        } else if (hour !== '*' && minute === '*') {
            return `매일 ${hour}시에 실행`;
        } else {
            return `매일 ${hour}시 ${minute}분에 실행`;
        }
    }
    

    if (dayOfWeek !== '*') {
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        
        if (dayOfWeek.includes(',')) {
            const days = dayOfWeek.split(',').map(d => weekdays[parseInt(d)]).join(', ');
            return `매주 ${days}요일에 실행`;
        } else if (dayOfWeek.includes('-')) {
            const [start, end] = dayOfWeek.split('-');
            const startDay = weekdays[parseInt(start)];
            const endDay = weekdays[parseInt(end)];
            return `매주 ${startDay}~${endDay}요일에 실행`;
        } else {
            const day = weekdays[parseInt(dayOfWeek)];
            return `매주 ${day}요일에 실행`;
        }
    }
    

    if (dayOfMonth !== '*') {
        if (dayOfMonth.includes(',')) {
            const days = dayOfMonth.split(',').join(', ');
            return `매월 ${days}일에 실행`;
        } else if (dayOfMonth.includes('-')) {
            const [start, end] = dayOfMonth.split('-');
            return `매월 ${start}~${end}일에 실행`;
        } else {
            return `매월 ${dayOfMonth}일에 실행`;
        }
    }
    

    if (month !== '*') {
        const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        if (month.includes(',')) {
            const monthList = month.split(',').map(m => months[parseInt(m)-1]).join(', ');
            return `${monthList}에 실행`;
        } else {
            return `${months[parseInt(month)-1]}에 실행`;
        }
    }
    
    return '정기 실행';
}


export function numberWithCommas(x) {
    if (x === undefined || x === null) return '';
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export function formatNumberWithUnits(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '';
    }

    if (num < 10000) {
        return numberWithCommas(num);
    }

    const units = [
        { value: 1e12, unit: '조' },
        { value: 1e8, unit: '억' },
        { value: 1e4, unit: '만' }
    ];

    for (let i = 0; i < units.length; i++) {
        if (num >= units[i].value) {
            const result = (num / units[i].value);

            return `${parseFloat(result.toFixed(1))}${units[i].unit}`;
        }
    }

    return numberWithCommas(num);
}


export function getKoreanDay(dateStr) {
    if (!dateStr) return '';
    const day = new Date(dateStr).getDay();
    return ['일','월','화','수','목','금','토'][day];
}
