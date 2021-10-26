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

function amplitudeTodBV(amplitude) {
    return 20 * Math.log(amplitude) / Math.LN10;
}

function rmsVoltToVpp(rmsVolt) {
    return 2 * Math.sqrt(2) * rmsVolt;
}

function selectNextRadioButton(radioButtons) {
    for (let i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked === true) {
            const nextRadioIndex = (i + 1) % radioButtons.length;
            radioButtons[nextRadioIndex].checked = true;
            break;
        }
    }
}

function getAverageValueFromList(list) {
    let sum = 0.0;

    for (let i = 0; i < list.length; i++) {
        sum += Number(list[i]);
    }

    return sum / list.length;
}
