
var con = require('manakin'); // terminal colouring utility

function log() {
    con.write(arguments, 96);
}

function logTable(thing) {
    console.table(thing);
}

function logTrace(thing) {
    console.log('----------- TRACE LOG START ---------');
    console.trace(thing);
    console.log('----------- TRACE LOG END ---------');
}

function logError() {
    con.write(arguments, 91);
}

module.exports = {
    log : log,
    logTable : logTable,
    logTrace : logTrace,
    logError : logError
}