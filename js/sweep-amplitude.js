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
}

function clickSetSettings() {
    document.getElementById("setSettingsBtn").disabled = true;

    setBufferSize();
    setAttenuator();
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

    if (graph === "gain") {
        showData("Gain", "dB", gainLeftArray, gainRightArray);
    } else if (graph === "rms") {
        showData("RMS", "dBV", rmsLeftArray, rmsRightArray);
    } else if (graph === "thd") {
        showData("THD", "dB", thdLeftArray, thdRightArray);
    } else if (graph === "thdN") {
        showData("THD+N", "dB", thdNLeftArray, thdNRightArray);
    } else if (graph === "snr") {
        showData("SNR", "dB", snrLeftArray, snrRightArray);
    } else if (graph === "phase") {
        showData("Phase", "Degrees", phaseLeftArray, phaseRightArray);
    }
}

function updateChannel() {
    const channel = document.querySelector('input[name="channelChoice"]:checked').value;

    if (channel === "left") {
        setChannels(true, false);
    } else if (channel === "right") {
        setChannels(false, true);
    } else if (channel === "both") {
        setChannels(true, true);
    }
}

function clickRun() {
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
    disableButtonsDuringAcquire();
    doMeasurement();
}

function clickStop() {
    run = false;
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

    const rmsLeft = Number(response.Left);
    const rmsRight = Number(response.Right);

    const rmsLeftPoint = toPoint(currentAmplitude, rmsLeft);
    const rmsRightPoint = toPoint(currentAmplitude, rmsRight);

    rmsLeftArray.push(rmsLeftPoint);
    rmsRightArray.push(rmsRightPoint);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "rms") {
        addPoint(rmsLeftPoint, rmsRightPoint);
    }

    refreshGain(rmsLeft, rmsRight);
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
    stepPosition++;

    if (run && stepPosition < steps.length) {
        currentAmplitude = steps[stepPosition];
        doMeasurement();
    } else {
        enableButtonsAfterAcquire();
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

function dbToVolt(db) {
    return Math.pow(10, db / 20);
}

function rmsVoltToVpp(rmsVolt) {
    return 2 * Math.sqrt(2) * rmsVolt;
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
