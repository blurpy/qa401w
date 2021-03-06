const basePath = "http://localhost:9401";

let run = false;
let currentRequests = 0;
let steps = [];
let stepPosition = 0;
let currentFrequency = 0;
let currentAmplitude = 0;
let measureFrequencyStart = 0;
let measureFrequencyStop = 0;

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
    currentAmplitude = document.getElementById("audioGen1Amplitude").value;
    makeRequest("PUT", "/Settings/AudioGen/Gen1/On/1000/" + currentAmplitude, updateGenerator1Output);
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
        showData("Gain", "dB", "Times", gainLeftArray, gainRightArray, gainDbToTimesFixed);
    } else if (graph === "power") {
        showData("Power", "Watt 4Ω", "Watt 8Ω", powerLeftArray, powerRightArray, power4ToPower8Fixed);
    } else if (graph === "rms") {
        showData("RMS", "dBV", "Volts", rmsLeftArray, rmsRightArray, dbToVoltFixed);
    } else if (graph === "thd") {
        showData("THD", "dB", "Percent", thdLeftArray, thdRightArray, dbToPercentFixed);
    } else if (graph === "thdN") {
        showData("THD+N", "dB", "Percent", thdNLeftArray, thdNRightArray, dbToPercentFixed);
    } else if (graph === "snr") {
        showData("SNR", "dB", null, snrLeftArray, snrRightArray, null);
    } else if (graph === "phase") {
        // Phase changes too much with frequency to show "seconds"
        showData("Phase", "Degrees", null, phaseLeftArray, phaseRightArray, null);
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
    if (run) {
        return;
    }

    stepPosition = 0;
    measureFrequencyStart = Number(document.getElementById("measureFrequencyStart").value);
    measureFrequencyStop = Number(document.getElementById("measureFrequencyStop").value);
    steps = generateSteps(measureFrequencyStart, measureFrequencyStop);
    currentFrequency = steps[stepPosition];

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

    const thdLeft = toPoint(currentFrequency, Number(response.Left));
    const thdRight = toPoint(currentFrequency, Number(response.Right));

    thdLeftArray.push(thdLeft);
    thdRightArray.push(thdRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "thd") {
        addPoint(thdLeft, thdRight);
    }
}

function refreshThdN(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);

    const thdNLeft = toPoint(currentFrequency, Number(response.Left));
    const thdNRight = toPoint(currentFrequency, Number(response.Right));

    thdNLeftArray.push(thdNLeft);
    thdNRightArray.push(thdNRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "thdN") {
        addPoint(thdNLeft, thdNRight);
    }
}

function refreshSnr(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);

    const snrLeft = toPoint(currentFrequency, Number(response.Left));
    const snrRight = toPoint(currentFrequency, Number(response.Right));

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

    const rmsLeftPoint = toPoint(currentFrequency, rmsLeft);
    const rmsRightPoint = toPoint(currentFrequency, rmsRight);

    rmsLeftArray.push(rmsLeftPoint);
    rmsRightArray.push(rmsRightPoint);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "rms") {
        addPoint(rmsLeftPoint, rmsRightPoint);
    }

    refreshGain(rmsLeft, rmsRight);
    refreshPower(rmsLeft, rmsRight);
}

function refreshGain(rmsLeft, rmsRight) {
    const gainLeft = toPoint(currentFrequency, rmsLeft - currentAmplitude);
    const gainRight = toPoint(currentFrequency, rmsRight - currentAmplitude);

    gainLeftArray.push(gainLeft);
    gainRightArray.push(gainRight);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "gain") {
        addPoint(gainLeft, gainRight);
    }
}

function refreshPower(rmsLeft, rmsRight) {
    const squareLeft = Math.pow(dbToVolt(rmsLeft), 2);
    const squareRight = Math.pow(dbToVolt(rmsRight), 2);

    const power4Left = toPoint(currentFrequency, squareLeft / 4);
    const power4Right = toPoint(currentFrequency, squareRight / 4);

    powerLeftArray.push(power4Left);
    powerRightArray.push(power4Right);

    const graphChoice = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graphChoice === "power") {
        addPoint(power4Left, power4Right);
    }
}

function refreshPhaseDegrees(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);

    const phaseLeft = toPoint(currentFrequency, Number(response.Left));
    const phaseRight = toPoint(currentFrequency, Number(response.Right));

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
        currentFrequency = steps[stepPosition];
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

function generateSteps(min, max) {
    const steps = [];

    if (max <= min) {
        alert("Start frequency must be lower than stop frequency");
        return steps;
    }

    let step = min;

    while (step <= max) {
        steps.push(step);

        if (step < 100) {
            step = Math.round((step + 10) / 10) * 10;
        } else if (step < 1000) {
            step = Math.round((step + 100) / 100) * 100;
        } else {
            step = Math.round((step + 1000) / 1000) * 1000;
        }
    }

    return steps;
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
