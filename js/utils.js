function dbToVolt(db) {
    return Math.pow(10, db / 20);
}

function dbToVoltFixed(db) {
    return dbToVolt(db).toFixed(3);
}

function dbToPercent(db) {
    return Math.pow(10, db / 20) * 100;
}

function dbToPercentFixed(db) {
    return dbToPercent(db).toFixed(4);
}

function power4ToPower8(power4) {
    return power4 / 2;
}

function power4ToPower8Fixed(power4) {
    return power4ToPower8(power4).toFixed(2);
}

function amplitudeTodBV(amplitude) {
    return 20 * Math.log(amplitude) / Math.LN10;
}

function rmsVoltToVpp(rmsVolt) {
    return 2 * Math.sqrt(2) * rmsVolt;
}
