


const adminUsedColors = new Set();
const adminPredefinedColors = [
    '#A3E4D7', '#FADBD8', '#D7BDE2', '#A9CCE3', '#A2D9CE',
    '#F5CBA7', '#D2B4DE', '#AED6F1', '#A9DFBF', '#F9E79F'
];
let adminColorIndex = 0;


export function getRandomColorForAdmin() {
    if (adminColorIndex < adminPredefinedColors.length) {
        const color = adminPredefinedColors[adminColorIndex];
        adminUsedColors.add(color);
        adminColorIndex++;
        return color;
    }

    let color;
    do {
        color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    } while (adminUsedColors.has(color));
    adminUsedColors.add(color);
    return color;
}
