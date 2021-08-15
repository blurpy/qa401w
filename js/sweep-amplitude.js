const basePath = "http://localhost:9401";
const measureFrequencyStart = 20;
const measureFrequencyStop = 20000;

let run = false;
let currentRequests = 0;
let steps = [];
let stepPosition = 0;
let currentFrequency = 0;
let currentAmplitude = 0;
let measureAmplitudeStart = 0;
let measureAmplitudeStop = 0;
let measureAmplitudeStep = 1;

let gainLeftArray = [];
let gainRightArray = [];
let powerLeftArray = [];
let powerRightArray = [];
let rmsLeftArray = [];
let rmsRightArray = [];
let thdLeftArray = [];
let thdRightArray = [];
let thdNLeftArray = [];
let thdNRightArray = [];
let snrLeftArray = [];
let snrRightArray = [];
let phaseLeftArray = [];
let phaseRightArray = [];

onDOMContentLoaded = (function() {
    registerButtons();
    initializeCharts();
    clickUpdateView();

    makeRequest("GET", "/Status/Version", refreshStatusVersion);

    updateGenerator1Output();
})();

function registerButtons() {
    document.getElementById("setSettingsBtn").addEventListener('click', clickSetSettings);
    document.getElementById("updateViewBtn").addEventListener('click', clickUpdateView);
    document.getElementById("resetZoomBtn").addEventListener('click', clickResetZoom);
    document.getElementById("runBtn").addEventListener('click', clickRun);
    document.getElementById("stopBtn").addEventListener('click', clickStop);
    document.getElementById("menuBtn").addEventListener('click', clickMenu);

    document.getElementById("menuColumn").addEventListener('transitionend', hideMenu);
    document.addEventListener('keyup', handleKeyboardShortcuts);
}

function clickSetSettings() {
    if (run) {
        return;
    }

    document.getElementById("setSettingsBtn").disabled = true;

    setBufferSize();
    setAttenuator();
    setExternalGain();
    setLoad();
    setGenerator1();
    setGenerator2();
    setWindowType();
    setSampleRate();
    setRoundFrequencies();
}

function setBufferSize() {
    const bufferSizeChoice = document.querySelector('#bufferSizeSelect option:checked').value;
    makeRequest("PUT", "/Settings/BufferSize/" + bufferSizeChoice, updateSetBufferSize.bind(null, bufferSizeChoice));
}

function updateSetBufferSize(bufferSizeChoice) {
    document.getElementById("setBufferSize").innerText = bufferSizeChoice;
}

function setAttenuator() {
    const attenuatorChoice = document.querySelector('input[name="attenuatorChoice"]:checked');
    makeRequest("PUT", "/Settings/Input/Max/" + attenuatorChoice.value, updateSetAttenuator.bind(null, attenuatorChoice.dataset.label));
}

function updateSetAttenuator(attenuatorChoice) {
    document.getElementById("setAttenuator").innerText = attenuatorChoice;
}

function setExternalGain() {
    const externalGain = document.getElementById("externalGain").value;
    document.getElementById("setExternalGain").innerText = externalGain;
}

function setLoad() {
    const load = document.getElementById("load").value;
    document.getElementById("setLoad").innerText = load;
}

function setGenerator1() {
    currentAmplitude = Number(document.getElementById("measureAmplitudeStart").value);
    currentFrequency = Number(document.getElementById("audioGen1Frequency").value);
    makeRequest("PUT", "/Settings/AudioGen/Gen1/On/" + currentFrequency + "/" + currentAmplitude, updateGenerator1Output);
}

function setGenerator2() {
    makeRequest("PUT", "/Settings/AudioGen/Gen2/Off/4500/-40", function() {});
}

function setWindowType() {
    const windowTypeChoice = document.querySelector('#windowTypeSelect option:checked').value;
    makeRequest("PUT", "/Settings/Window/" + windowTypeChoice, updateSetWindowType.bind(null, windowTypeChoice));
}

function updateSetWindowType(windowTypeChoice) {
    document.getElementById("setWindowType").innerText = windowTypeChoice;
}

function setSampleRate() {
    const sampleRate = document.querySelector('input[name="sampleRateChoice"]:checked');
    makeRequest("PUT", "/Settings/SampleRate/" + sampleRate.value, updateSetSampleRate.bind(null, sampleRate.dataset.label));
}

function updateSetSampleRate(sampleRate) {
    document.getElementById("setSampleRate").innerText = sampleRate;
}

function setRoundFrequencies() {
    const checked = document.querySelector('input[name="roundFrequenciesCheck"]').checked;
    const enabled = (checked ? "On" : "Off");
    makeRequest("PUT", "/Settings/RoundFrequencies/" + enabled, function() {});
}

function updateGenerator1Output() {
    const volt = dbToVolt(currentAmplitude);

    document.getElementById("audioGen1OutputFrequency").innerText = currentFrequency;
    document.getElementById("audioGen1OutputDbv").innerText = currentAmplitude;
    document.getElementById("audioGen1OutputVrms").innerText = volt.toFixed(3);
    document.getElementById("audioGen1OutputVpp").innerText = rmsVoltToVpp(volt).toFixed(3);
}

function clickUpdateView() {
    updateGraph();
    updateChannel();
}

function clickResetZoom() {
    resetZoom();
}

function updateGraph() {
    const graph = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graph === "table") {
        showTable();
        resetTable();
        fillTable();
    }

    else {
        showGraph();

        if (graph === "gain") {
            showData("Gain", "dB", "Times", gainLeftArray, gainRightArray, gainDbToTimesFixed);
        } else if (graph === "power") {
            showData("Power", "Watt", null, powerLeftArray, powerRightArray, null);
        } else if (graph === "rms") {
            showData("RMS", "dBV", "Volts", rmsLeftArray, rmsRightArray, dbToVoltFixed);
        } else if (graph === "thd") {
            showData("THD", "dB", "Percent", thdLeftArray, thdRightArray, dbToPercentFixed);
        } else if (graph === "thdN") {
            showData("THD+N", "dB", "Percent", thdNLeftArray, thdNRightArray, dbToPercentFixed);
        } else if (graph === "snr") {
            showData("SNR", "dB", null, snrLeftArray, snrRightArray, null);
        } else if (graph === "phase") {
            showData("Phase", "Degrees", "Milliseconds", phaseLeftArray, phaseRightArray, degreeToMillisecondsFixed);
        }
    }
}

function updateChannel() {
    const channel = document.querySelector('input[name="channelChoice"]:checked').value;

    if (channel === "left") {
        setChannels(true, false);
        updateChannelInputEnabled(true, false);
    } else if (channel === "right") {
        setChannels(false, true);
        updateChannelInputEnabled(false, true);
    } else if (channel === "both") {
        setChannels(true, true);
        updateChannelInputEnabled(true, true);
    }
}

function updateChannelInputEnabled(leftChannel, rightChannel) {
    if (leftChannel && rightChannel) {
        document.getElementById("rmsInputLeftText").classList.remove("text-black-50");
        document.getElementById("rmsInputRightText").classList.remove("text-black-50");
    } else if (leftChannel) {
        document.getElementById("rmsInputLeftText").classList.remove("text-black-50");
        document.getElementById("rmsInputRightText").classList.add("text-black-50");
    } else if (rightChannel) {
        document.getElementById("rmsInputLeftText").classList.add("text-black-50");
        document.getElementById("rmsInputRightText").classList.remove("text-black-50");
    }
}

function clickRun() {
    if (run) {
        return;
    }

    stepPosition = 0;
    measureAmplitudeStart = Number(document.getElementById("measureAmplitudeStart").value);
    measureAmplitudeStop = Number(document.getElementById("measureAmplitudeStop").value);
    measureAmplitudeStep = Number(document.getElementById("measureAmplitudeStep").value);
    steps = generateSteps(measureAmplitudeStart, measureAmplitudeStop, measureAmplitudeStep);
    currentAmplitude = steps[stepPosition];
    currentFrequency = Number(document.getElementById("audioGen1Frequency").value);

    if (steps.length === 0) {
        return;
    }

    run = true;

    updateGenerator1Output();
    resetMeasurements();
    resetCharts();
    resetTable();
    disableButtonsDuringAcquire();
    doMeasurement();
}

function clickStop() {
    run = false;
}

function clickMenu() {
    document.getElementById("menuColumn").classList.remove("d-none");
    document.getElementById("menuColumn").clientWidth; // Force browser to update visibility now

    document.getElementById("menuColumn").classList.toggle("collapsed");
    document.getElementById("contentColumn").classList.toggle("col-9");
    document.getElementById("contentColumn").classList.toggle("col-12");
}

function hideMenu() {
    const collapsed = document.getElementById("menuColumn").classList.contains("collapsed");

    if (collapsed) {
        document.getElementById("menuColumn").classList.add("d-none");
    }
}

// Using Shift+Letter
function handleKeyboardShortcuts(event) {
    if (event.key === "M") {
        clickMenu();
    } else if (event.key === "R") {
        clickRun();
    } else if (event.key === "S") {
        clickStop();
    } else if (event.key === "E") {
        clickSetSettings();
    } else if (event.key === "G") {
        changeGraph();
    } else if (event.key === "C") {
        changeChannel();
    } else if (event.key === "Z") {
        resetZoom();
    }
}

function changeGraph() {
    if (run) {
        return;
    }

    const graphChoices = document.getElementsByName("graphChoice");
    selectNextRadioButton(graphChoices);
    clickUpdateView();
}

function changeChannel() {
    if (run) {
        return;
    }

    const channelChoices = document.getElementsByName("channelChoice");
    selectNextRadioButton(channelChoices);
    clickUpdateView();
}

function doAcquire() {
    makeRequest("POST", "/Acquisition", refreshAcquisition);
}

function doMeasurement() {
    makeRequest("PUT", "/Settings/AudioGen/Gen1/On/" + currentFrequency + "/" + currentAmplitude, doAcquire);
}

function refreshStatusVersion(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("statusVersion").innerText = response.Value;
}

function refreshThd(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);

    const thdLeft = toPoint(currentAmplitude, Number(response.Left));
    const thdRight = toPoint(currentAmplitude, Number(response.Right));

    thdLeftArray.push(thdLeft);
    thdRightArray.push(thdRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "thd") {
        addPoint(thdLeft, thdRight);
    }
}

function refreshThdN(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);

    const thdNLeft = toPoint(currentAmplitude, Number(response.Left));
    const thdNRight = toPoint(currentAmplitude, Number(response.Right));

    thdNLeftArray.push(thdNLeft);
    thdNRightArray.push(thdNRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "thdN") {
        addPoint(thdNLeft, thdNRight);
    }
}

function refreshSnr(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);

    const snrLeft = toPoint(currentAmplitude, Number(response.Left));
    const snrRight = toPoint(currentAmplitude, Number(response.Right));

    snrLeftArray.push(snrLeft);
    snrRightArray.push(snrRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "snr") {
        addPoint(snrLeft, snrRight);
    }
}

function refreshRms(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    const externalGain = Number(document.getElementById("externalGain").value);

    const rmsLeft = Number(response.Left) + (externalGain * -1);
    const rmsRight = Number(response.Right) + (externalGain * -1);

    const rmsLeftPoint = toPoint(currentAmplitude, rmsLeft);
    const rmsRightPoint = toPoint(currentAmplitude, rmsRight);

    rmsLeftArray.push(rmsLeftPoint);
    rmsRightArray.push(rmsRightPoint);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "rms") {
        addPoint(rmsLeftPoint, rmsRightPoint);
    }

    refreshRmsInput(response);
    refreshGain(rmsLeft, rmsRight);
    refreshPower(rmsLeft, rmsRight);
}

function refreshRmsInput(response) {
    const rmsInputLeft = Number(response.Left);
    const rmsInputVoltLeft = dbToVolt(rmsInputLeft);
    const rmsInputVppLeft = rmsVoltToVpp(rmsInputVoltLeft);

    document.getElementById("rmsInputLeft").innerText = rmsInputLeft.toFixed(3);
    document.getElementById("rmsInputVoltLeft").innerText = rmsInputVoltLeft.toFixed(3);
    document.getElementById("rmsInputVppLeft").innerText = rmsInputVppLeft.toFixed(3);

    const rmsInputRight = Number(response.Right);
    const rmsInputVoltRight = dbToVolt(rmsInputRight);
    const rmsInputVppRight = rmsVoltToVpp(rmsInputVoltRight);

    document.getElementById("rmsInputRight").innerText = rmsInputRight.toFixed(3);
    document.getElementById("rmsInputVoltRight").innerText = rmsInputVoltRight.toFixed(3);
    document.getElementById("rmsInputVppRight").innerText = rmsInputVppRight.toFixed(3);
}

function refreshGain(rmsLeft, rmsRight) {
    const gainLeft = toPoint(currentAmplitude, rmsLeft - currentAmplitude);
    const gainRight = toPoint(currentAmplitude, rmsRight - currentAmplitude);

    gainLeftArray.push(gainLeft);
    gainRightArray.push(gainRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "gain") {
        addPoint(gainLeft, gainRight);
    }
}

function refreshPower(rmsLeft, rmsRight) {
    const load = document.getElementById("load").value;

    const squareLeft = Math.pow(dbToVolt(rmsLeft), 2);
    const squareRight = Math.pow(dbToVolt(rmsRight), 2);

    const powerLeft = toPoint(currentAmplitude, squareLeft / load);
    const powerRight = toPoint(currentAmplitude, squareRight / load);

    powerLeftArray.push(powerLeft);
    powerRightArray.push(powerRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "power") {
        addPoint(powerLeft, powerRight);
    }
}

function refreshPhaseDegrees(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);

    const phaseLeft = toPoint(currentAmplitude, Number(response.Left));
    const phaseRight = toPoint(currentAmplitude, Number(response.Right));

    phaseLeftArray.push(phaseLeft);
    phaseRightArray.push(phaseRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "phase") {
        addPoint(phaseLeft, phaseRight);
    }
}

function refreshAcquisition() {
    makeRequest("GET", "/ThdDb/" + currentFrequency + "/" + (measureFrequencyStop + 10), refreshThd);
    makeRequest("GET", "/ThdnDb/" + currentFrequency + "/" + measureFrequencyStart + "/" + (measureFrequencyStop + 10), refreshThdN);
    makeRequest("GET", "/SnrDb/" + currentFrequency + "/" + measureFrequencyStart + "/" + measureFrequencyStop, refreshSnr);
    makeRequest("GET", "/RmsDbv/" + measureFrequencyStart + "/" + (measureFrequencyStop + 10), refreshRms);
    makeRequest("GET", "/Phase/Degrees", refreshPhaseDegrees);
    updateGenerator1Output();
}

function requestsComplete() {
    updateTableIfVisible();
    stepPosition++;

    if (run && stepPosition < steps.length) {
        currentAmplitude = steps[stepPosition];
        doMeasurement();
    } else {
        enableButtonsAfterAcquire();
        run = false;
    }
}

function makeRequest(method, path, callback) {
    let httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
        alert('Giving up :( Cannot create an XMLHTTP instance');
        return false;
    }

    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === XMLHttpRequest.OPENED) {
            currentRequests++;
        } else if (httpRequest.readyState === XMLHttpRequest.DONE) {
            currentRequests--;

            if (httpRequest.status === 200) {
                callback(httpRequest);

                if (currentRequests === 0) {
                    requestsComplete();
                }
            } else {
                run = false;
                alert('There was a problem with the request.');
            }
        }
    };

    httpRequest.open(method, basePath + path);
    httpRequest.send();
}

function gainDbToTimes(gainDb) {
    // gainDb = rms (measured) - amplitude (signal out)
    const rms = Number(currentAmplitude) + Number(gainDb);
    return dbToVolt(rms) / dbToVolt(currentAmplitude);
}

function gainDbToTimesFixed(gainDb) {
    return gainDbToTimes(gainDb).toFixed(1);
}

/**
 * Note: the degree from QA401 needs to be modified somewhat before the regular calculation to seconds,
 * since it's "behind" instead of "ahead", to get a calculation that matches what is reported by the api.
 *
 * @matt (QA): A lag of 166 degrees is the same as a lead of 194 degrees (and vice versa). 360-166 = 194.
 *
 * Example calculations for both degrees to seconds, and seconds to degrees,
 * using values from the QA401 as input, and the mentioned modification to get it to match both ways:
 *
 * time delay = degree / 360 * frequency (1/Hz)
 * (360 - 165.02559759207662) / 360 * 0.001 = 0.0005415955622442316
 *
 * degree = 360 * time delay / frequency (1/Hz)
 * 360 - (360 * 0.0005415955622442316 / 0.001) = 165.0255975920766
 */
function degreeToSeconds(degree) {
    return (360 - degree) / 360 * (1 / currentFrequency);
}

function degreeToMillisecondsFixed(degree) {
    return (degreeToSeconds(degree) * 1000).toFixed(3);
}

function generateSteps(min, max, stepValue) {
    const steps = [];

    if (max <= min) {
        alert("Start amplitude must be lower than stop amplitude");
        return steps;
    }

    if (stepValue < 0.1) {
        alert("Amplitude step must be at least 0.1");
        return steps;
    }

    let step = min;

    while (step <= max) {
        steps.push(step);

        step = toFixedNumber(step + stepValue);
    }

    if (steps[steps.length - 1] < max) {
        steps.push(max);
    }

    return steps;
}

// https://stackoverflow.com/questions/2283566/how-can-i-round-a-number-in-javascript-tofixed-returns-a-string
function toFixedNumber(number) {
    return Math.round(number * 1e2) / 1e2;
}

function resetMeasurements() {
    gainLeftArray = [];
    gainRightArray = [];
    powerLeftArray = [];
    powerRightArray = [];
    rmsLeftArray = [];
    rmsRightArray = [];
    thdLeftArray = [];
    thdRightArray = [];
    thdNLeftArray = [];
    thdNRightArray = [];
    snrLeftArray = [];
    snrRightArray = [];
    phaseLeftArray = [];
    phaseRightArray = [];
}

function disableButtonsDuringAcquire() {
    document.getElementById("setSettingsBtn").disabled = true;
    document.getElementById("runBtn").disabled = true;
    document.getElementById("updateViewBtn").disabled = true;
}

function enableButtonsAfterAcquire() {
    document.getElementById("setSettingsBtn").disabled = false;
    document.getElementById("runBtn").disabled = false;
    document.getElementById("updateViewBtn").disabled = false;
}

function showTable() {
    const channel = document.querySelector('input[name="channelChoice"]:checked').value;

    if (channel === "both" || channel === "left") {
        document.getElementById('amplitudeTableLeft').classList.remove("d-none");
        document.getElementById('amplitudeTableLeft').classList.add("d-inline-block");
    } else {
        document.getElementById('amplitudeTableLeft').classList.add("d-none");
        document.getElementById('amplitudeTableLeft').classList.remove("d-inline-block");
    }

    if (channel === "both" || channel === "right") {
        document.getElementById('amplitudeTableRight').classList.remove("d-none");
        document.getElementById('amplitudeTableRight').classList.add("d-inline-block");
    } else {
        document.getElementById('amplitudeTableRight').classList.add("d-none");
        document.getElementById('amplitudeTableRight').classList.remove("d-inline-block");
    }

    document.getElementById('amplitudeChart').classList.add("d-none");
}

function showGraph() {
    document.getElementById('amplitudeTableLeft').classList.add("d-none");
    document.getElementById('amplitudeTableLeft').classList.remove("d-inline-block");
    document.getElementById('amplitudeTableRight').classList.add("d-none");
    document.getElementById('amplitudeTableRight').classList.remove("d-inline-block");
    document.getElementById('amplitudeChart').classList.remove("d-none");
}

function resetTable() {
    const tBodyLeft = document.getElementById('amplitudeTableLeft').getElementsByTagName('tbody')[0];
    const tBodyRight = document.getElementById('amplitudeTableRight').getElementsByTagName('tbody')[0];

    for (let i = 0; i< tBodyLeft.rows.length;){
        tBodyLeft.deleteRow(i);
    }

    for (let i = 0; i< tBodyRight.rows.length;){
        tBodyRight.deleteRow(i);
    }
}

function fillTable() {
    const tBodyLeft = document.getElementById('amplitudeTableLeft').getElementsByTagName('tbody')[0];
    const tBodyRight = document.getElementById('amplitudeTableRight').getElementsByTagName('tbody')[0];

    for (let i = 0; i < gainLeftArray.length; i++) {
        addTableTow(tBodyLeft, i, gainLeftArray, powerLeftArray, rmsLeftArray, thdLeftArray, thdNLeftArray, snrLeftArray);
        addTableTow(tBodyRight, i, gainRightArray, powerRightArray, rmsRightArray, thdRightArray, thdNRightArray, snrRightArray);
    }
}

function addLastMeasurementToTable() {
    const tBodyLeft = document.getElementById('amplitudeTableLeft').getElementsByTagName('tbody')[0];
    const tBodyRight = document.getElementById('amplitudeTableRight').getElementsByTagName('tbody')[0];

    const rowNr = gainLeftArray.length - 1;

    if (rowNr >= 0) {
        addTableTow(tBodyLeft, rowNr, gainLeftArray, powerLeftArray, rmsLeftArray, thdLeftArray, thdNLeftArray, snrLeftArray);
        addTableTow(tBodyRight, rowNr, gainRightArray, powerRightArray, rmsRightArray, thdRightArray, thdNRightArray, snrRightArray);
    }
}

function addTableTow(tBody, rowNr, gainArray, powerArray, rmsArray, thdArray, thdNArray, snrArray) {
    const newRow = tBody.insertRow();

    addTableCell(newRow, gainArray[rowNr].x);
    addTableCell(newRow, gainArray[rowNr].y.toFixed(1));
    addTableCell(newRow, powerArray[rowNr].y.toFixed(2));
    addTableCell(newRow, dbToVoltFixed(rmsArray[rowNr].y));
    addTableCell(newRow, dbToPercent(thdArray[rowNr].y).toFixed(6));
    addTableCell(newRow, dbToPercent(thdNArray[rowNr].y).toFixed(6));
    addTableCell(newRow, snrArray[rowNr].y.toFixed(3));
}

function addTableCell(row, value) {
    const newCell = row.insertCell();
    newCell.appendChild(document.createTextNode(value));
}

function updateTableIfVisible() {
    const graph = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graph === "table") {
        addLastMeasurementToTable();
    }
}
