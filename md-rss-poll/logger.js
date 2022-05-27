const formatDateTime = function(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dom = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return `${year}/${month.toString().padStart(2, '0')}/${dom.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
};

exports.log = function(logLevel, message, color) {
    const dateString = formatDateTime(new Date());
    console.log(`${dateString} - ${logLevel} - ${color ? color : ''}${message}${color ? '\x1b[0m' : ''}`);
};

exports.COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m'
};