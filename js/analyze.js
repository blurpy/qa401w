const basePath = "http://localhost:9401";
const measureFrequencyStart = 20;
let measureFrequencyStop = 20000;
const avgLimit = 100;
const maxTimeData = 0.3; // Seconds - to avoid extreme slowdown of the browser

let run = false;
let currentRequests = 0;
let thdAvgLeft = [];
let thdAvgRight = [];
let thdNAvgLeft = [];
let thdNAvgRight = [];

onDOMContentLoaded = (function() {
    registerButtons();
    initializeCharts();
    clickUpdateView();

    makeRequest("GET", "/Status/Version", refreshStatusVersion);

    updateGenerator1Output();
    updateGenerator2Output();
    updateAudioGeneratorsEnabled();
})();

function registerButtons() {
    document.getElementById("setSettingsBtn").addEventListener('click', clickSetSettings);
    document.getElementById("updateViewBtn").addEventListener('click', clickUpdateView);
    document.getElementById("resetZoomBtn").addEventListener('click', clickResetZoom);
    document.getElementById("acquireBtn").addEventListener('click', clickAcquire);
    document.getElementById("runBtn").addEventListener('click', clickRun);
    document.getElementById("stopBtn").addEventListener('click', clickStop);
    document.getElementById("menuBtn").addEventListener('click', clickMenu);

    document.getElementById("audioGen1Check").addEventListener('click', clickAudioGenerator1);
    document.getElementById("audioGen2Check").addEventListener('click', clickAudioGenerator2);

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
    setMeasureFrequencyStop();
    setRoundFrequencies();
    setFetchData();
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
    const externalGain = Number(document.getElementById("externalGain").value);
    document.getElementById("setExternalGain").innerText = externalGain;

    if (externalGain === 0) {
        document.getElementById("rmsInputRow").classList.add("d-none");
    } else {
        document.getElementById("rmsInputRow").classList.remove("d-none");
    }
}

function setLoad() {
    const load = document.getElementById("load").value;

    document.getElementById("powerLoadLeft").innerText = load;
    document.getElementById("powerLoadRight").innerText = load;

    // Reset previous measurement to avoid misunderstandings
    document.getElementById("powerLeft").innerText = "0";
    document.getElementById("powerRight").innerText = "0";
}

function setGenerator1() {
    const checked = document.querySelector('input[name="audioGen1Check"]').checked;
    const enabled = (checked ? "On" : "Off");
    const frequency =  document.getElementById("audioGen1Frequency").value;
    const amplitude =  document.getElementById("audioGen1Amplitude").value;
    makeRequest("PUT", "/Settings/AudioGen/Gen1/" + enabled + "/" + frequency + "/" + amplitude, updateGenerator1Output);
}

function setGenerator2() {
    const checked = document.querySelector('input[name="audioGen2Check"]').checked;
    const enabled = (checked ? "On" : "Off");
    const frequency =  document.getElementById("audioGen2Frequency").value;
    const amplitude =  document.getElementById("audioGen2Amplitude").value;
    makeRequest("PUT", "/Settings/AudioGen/Gen2/" + enabled + "/" + frequency + "/" + amplitude, updateGenerator2Output);
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

function setMeasureFrequencyStop() {
    measureFrequencyStop = Number(document.getElementById("measureFrequencyStop").value);
    document.getElementById("setMeasureFrequencyStop").innerText = measureFrequencyStop;

    updateFrequencyChartStopFrequency(measureFrequencyStop);
}

function setRoundFrequencies() {
    const checked = document.querySelector('input[name="roundFrequenciesCheck"]').checked;
    const enabled = (checked ? "On" : "Off");
    makeRequest("PUT", "/Settings/RoundFrequencies/" + enabled, function() {});
}

function setFetchData() {
    const fetchFrequencyData = document.querySelector('input[name="fetchFrequencyCheck"]').checked;
    const fetchTimeData = document.querySelector('input[name="fetchTimeCheck"]').checked;

    if (!fetchFrequencyData) {
        updateFrequencyChart([], []);
    }

    if (!fetchTimeData) {
        updateTimeChart([], []);
    }
}

function updateGenerator1Output() {
    const generatorEnabled = document.querySelector('input[name="audioGen1Check"]').checked;
    const frequency =  document.getElementById("audioGen1Frequency").value;
    const amplitude =  document.getElementById("audioGen1Amplitude").value;
    const volt = dbToVolt(amplitude);

    document.getElementById("audioGen1OutputFrequency").innerText = frequency;
    document.getElementById("audioGen1OutputDbv").innerText = amplitude;
    document.getElementById("audioGen1OutputVrms").innerText = volt.toFixed(3);
    document.getElementById("audioGen1OutputVpp").innerText = rmsVoltToVpp(volt).toFixed(3);

    if (generatorEnabled) {
        document.getElementById("audioGen1OutputText").classList.remove("text-black-50");
    } else {
        document.getElementById("audioGen1OutputText").classList.add("text-black-50");
    }
}

function updateGenerator2Output() {
    const generatorEnabled = document.querySelector('input[name="audioGen2Check"]').checked;
    const frequency =  document.getElementById("audioGen2Frequency").value;
    const amplitude =  document.getElementById("audioGen2Amplitude").value;
    const volt = dbToVolt(amplitude);

    document.getElementById("audioGen2OutputFrequency").innerText = frequency;
    document.getElementById("audioGen2OutputDbv").innerText = amplitude;
    document.getElementById("audioGen2OutputVrms").innerText = volt.toFixed(3);
    document.getElementById("audioGen2OutputVpp").innerText = rmsVoltToVpp(volt).toFixed(3);

    if (generatorEnabled) {
        document.getElementById("audioGen2OutputText").classList.remove("text-black-50");
    } else {
        document.getElementById("audioGen2OutputText").classList.add("text-black-50");
    }
}

function updateAudioGeneratorsEnabled() {
    clickAudioGenerator1();
    clickAudioGenerator2();
}

function clickUpdateView() {
    updateGraph();
    updateChannel();
    updateAverageThd();
}

function clickResetZoom() {
    resetZoom();
}

function updateGraph() {
    const graph = document.querySelector('input[name="graphChoice"]:checked').value;

    if (graph === "frequency") {
        showFrequencyChart();
    } else if (graph === "time") {
        showTimeChart();
    }
}

function updateChannel() {
    const channel = document.querySelector('input[name="channelChoice"]:checked').value;

    if (channel === "left") {
        setChannels(true, false);
        updateChannelTableEnabled(true, false);
    } else if (channel === "right") {
        setChannels(false, true);
        updateChannelTableEnabled(false, true);
    } else if (channel === "both") {
        setChannels(true, true);
        updateChannelTableEnabled(true, true);
    }
}

function updateChannelTableEnabled(leftChannel, rightChannel) {
    if (leftChannel && rightChannel) {
        updateElementsEnabled(document.getElementsByClassName("leftResult"), true);
        updateElementsEnabled(document.getElementsByClassName("rightResult"), true);
    } else if (leftChannel) {
        updateElementsEnabled(document.getElementsByClassName("leftResult"), true);
        updateElementsEnabled(document.getElementsByClassName("rightResult"), false);
    } else if (rightChannel) {
        updateElementsEnabled(document.getElementsByClassName("leftResult"), false);
        updateElementsEnabled(document.getElementsByClassName("rightResult"), true);
    }
}

function updateAverageThd() {
    const showAverageThd = document.querySelector('input[name="averageThdCheck"]').checked;

    if (showAverageThd) {
        document.getElementById("thdAvgRow").classList.remove("d-none");
        document.getElementById("thdnAvgRow").classList.remove("d-none");
    } else {
        document.getElementById("thdAvgRow").classList.add("d-none");
        document.getElementById("thdnAvgRow").classList.add("d-none");
    }
}

function clickAcquire() {
    if (run) {
        return;
    }

    run = false;
    currentRequests = 0;
    thdAvgLeft = [];
    thdAvgRight = [];
    thdNAvgLeft = [];
    thdNAvgRight = [];

    disableButtonsDuringAcquire();
    doAcquire();
}

function clickRun() {
    if (run) {
        return;
    }

    run = true;
    currentRequests = 0;
    thdAvgLeft = [];
    thdAvgRight = [];
    thdNAvgLeft = [];
    thdNAvgRight = [];

    disableButtonsDuringAcquire();
    doAcquire();
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

function clickAudioGenerator1() {
    updateAudioGeneratorEnabled("audioGen1Check",
        "audioGen1FrequencyText", "audioGen1Frequency",
        "audioGen1AmplitudeText", "audioGen1Amplitude");
}

function clickAudioGenerator2() {
    updateAudioGeneratorEnabled("audioGen2Check",
        "audioGen2FrequencyText", "audioGen2Frequency",
        "audioGen2AmplitudeText", "audioGen2Amplitude");
}

function updateAudioGeneratorEnabled(checkboxId, frequencyLabelId, frequencyInputId, amplitudeLabelId, amplitudeInputId) {
    if (document.getElementById(checkboxId).checked) {
        document.getElementById(frequencyLabelId).classList.remove("text-black-50");
        document.getElementById(frequencyInputId).classList.remove("text-black-50");
        document.getElementById(amplitudeLabelId).classList.remove("text-black-50");
        document.getElementById(amplitudeInputId).classList.remove("text-black-50");
    } else {
        document.getElementById(frequencyLabelId).classList.add("text-black-50");
        document.getElementById(frequencyInputId).classList.add("text-black-50");
        document.getElementById(amplitudeLabelId).classList.add("text-black-50");
        document.getElementById(amplitudeInputId).classList.add("text-black-50");
    }
}

// Using Shift+Letter
function handleKeyboardShortcuts(event) {
    if (event.key === "M") {
        clickMenu();
    } else if (event.key === "A") {
        clickAcquire();
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
    const graphChoices = document.getElementsByName("graphChoice");
    selectNextRadioButton(graphChoices);
    clickUpdateView();
}

function changeChannel() {
    const channelChoices = document.getElementsByName("channelChoice");
    selectNextRadioButton(channelChoices);
    clickUpdateView();
}

function doAcquire() {
    makeRequest("POST", "/Acquisition", refreshAcquisition);
}

function refreshStatusVersion(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("statusVersion").innerText = response.Value;
}

function refreshThd(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdLeft").innerText = Number(response.Left).toFixed(3);
    document.getElementById("thdRight").innerText = Number(response.Right).toFixed(3);

    const showAverageThd = document.querySelector('input[name="averageThdCheck"]').checked;

    if (showAverageThd) {
        refreshThdAverage(response);
    }
}

function refreshThdPct(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdPctLeft").innerText = Number(response.Left).toFixed(6);
    document.getElementById("thdPctRight").innerText = Number(response.Right).toFixed(6);
}

function refreshThdAverage(response) {
    addToAverageList(thdAvgLeft, response.Left);
    addToAverageList(thdAvgRight, response.Right);

    let leftAvg = getAverageValueFromList(thdAvgLeft);
    let rightAvg = getAverageValueFromList(thdAvgRight);

    document.getElementById("thdAvgLeft").innerText = leftAvg.toFixed(3);
    document.getElementById("thdAvgRight").innerText = rightAvg.toFixed(3);

    document.getElementById("thdPctAvgLeft").innerText = dbToPercent(leftAvg).toFixed(6);
    document.getElementById("thdPctAvgRight").innerText = dbToPercent(rightAvg).toFixed(6);
}

function refreshThdN(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdnLeft").innerText = Number(response.Left).toFixed(3);
    document.getElementById("thdnRight").innerText = Number(response.Right).toFixed(3);

    const showAverageThd = document.querySelector('input[name="averageThdCheck"]').checked;

    if (showAverageThd) {
        refreshThdNAverage(response);
    }
}

function refreshThdNPct(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdnPctLeft").innerText = Number(response.Left).toFixed(6);
    document.getElementById("thdnPctRight").innerText = Number(response.Right).toFixed(6);
}

function refreshThdNAverage(response) {
    addToAverageList(thdNAvgLeft, response.Left);
    addToAverageList(thdNAvgRight, response.Right);

    let leftAvg = getAverageValueFromList(thdNAvgLeft);
    let rightAvg = getAverageValueFromList(thdNAvgRight);

    document.getElementById("thdnAvgLeft").innerText = leftAvg.toFixed(3);
    document.getElementById("thdnAvgRight").innerText = rightAvg.toFixed(3);

    document.getElementById("thdnPctAvgLeft").innerText = dbToPercent(leftAvg).toFixed(6);
    document.getElementById("thdnPctAvgRight").innerText = dbToPercent(rightAvg).toFixed(6);
}

function refreshSnr(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("snrLeft").innerText = Number(response.Left).toFixed(3);
    document.getElementById("snrRight").innerText = Number(response.Right).toFixed(3);
}

function refreshRms(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    const externalGain = Number(document.getElementById("externalGain").value);

    let rmsLeft = Number(response.Left) + (externalGain * -1);
    let rmsVoltLeft = dbToVolt(rmsLeft);
    let rmsVppLeft = rmsVoltToVpp(rmsVoltLeft);

    document.getElementById("rmsLeft").innerText = rmsLeft.toFixed(3);
    document.getElementById("rmsVoltLeft").innerText = rmsVoltLeft.toFixed(3);
    document.getElementById("rmsVppLeft").innerText = rmsVppLeft.toFixed(3);

    let rmsRight = Number(response.Right) + (externalGain * -1);
    let rmsVoltRight = dbToVolt(rmsRight);
    let rmsVppRight = rmsVoltToVpp(rmsVoltRight);

    document.getElementById("rmsRight").innerText = rmsRight.toFixed(3);
    document.getElementById("rmsVoltRight").innerText = rmsVoltRight.toFixed(3);
    document.getElementById("rmsVppRight").innerText = rmsVppRight.toFixed(3);

    refreshRmsInput(response);
    refreshGain(rmsLeft, rmsVoltLeft, rmsRight, rmsVoltRight);
    refreshPower(rmsVoltLeft, rmsVoltRight);
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

function refreshGain(rmsLeft, rmsVoltLeft, rmsRight, rmsVoltRight) {
    const amplitude = document.getElementById("audioGen1Amplitude").value;

    const gainLeft = rmsLeft - amplitude;
    const gainTimesLeft = rmsVoltLeft / dbToVolt(amplitude);
    document.getElementById("gainLeft").innerText = gainLeft.toFixed(1);
    document.getElementById("gainTimesLeft").innerText = gainTimesLeft.toFixed(1);

    const gainRight = rmsRight - amplitude;
    const gainTimesRight = rmsVoltRight / dbToVolt(amplitude);
    document.getElementById("gainRight").innerText = gainRight.toFixed(1);
    document.getElementById("gainTimesRight").innerText = gainTimesRight.toFixed(1);
}

function refreshPower(rmsVoltLeft, rmsVoltRight) {
    const load = document.getElementById("load").value;

    const squareLeft = Math.pow(rmsVoltLeft, 2);
    const powerLeft = squareLeft / load;
    document.getElementById("powerLeft").innerText = powerLeft.toFixed(2);

    const squareRight = Math.pow(rmsVoltRight, 2);
    const powerRight = squareRight / load;
    document.getElementById("powerRight").innerText = powerRight.toFixed(2);
}

function refreshPeak(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    const externalGain = Number(document.getElementById("externalGain").value);

    const peakLeft = Number(response.Left) + (externalGain * -1);
    const peakRight = Number(response.Right) + (externalGain * -1);

    document.getElementById("peakLeft").innerText = peakLeft.toFixed(3);
    document.getElementById("peakRight").innerText = peakRight.toFixed(3);
}

function refreshPeakFrequency(leftDataPoints, rightDataPoints) {
    const peakLeftFrequency = findPeakFrequency(leftDataPoints);
    const peakRightFrequency = findPeakFrequency(rightDataPoints);

    document.getElementById("peakLeftFrequency").innerText = Number(peakLeftFrequency).toFixed(1);
    document.getElementById("peakRightFrequency").innerText = Number(peakRightFrequency).toFixed(1);
}

function refreshPhaseDegrees(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("phaseDegreeLeft").innerText = Number(response.Left).toFixed(3);
    document.getElementById("phaseDegreeRight").innerText = Number(response.Right).toFixed(3);
}

function refreshPhaseSeconds(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("phaseSecondLeft").innerText = Number(response.Left).toFixed(6);
    document.getElementById("phaseSecondRight").innerText = Number(response.Right).toFixed(6);
}

function refreshFrequencyChart(httpRequest) {
    const attenuatorChoice = document.querySelector('input[name="attenuatorChoice"]:checked').value;
    const externalGain = Number(document.getElementById("externalGain").value);
    const attenuation = (attenuatorChoice === "26" ? 20 : 0) + (externalGain * -1);

    const response = JSON.parse(httpRequest.responseText);
    const leftDataPoints = base64ToFrequencyDataPoints(response.Left, response.Dx, attenuation);
    const rightDataPoints = base64ToFrequencyDataPoints(response.Right, response.Dx, attenuation);

    updateFrequencyChart(leftDataPoints, rightDataPoints);
    refreshPeakFrequency(leftDataPoints, rightDataPoints)
}

function refreshTimeChart(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    const externalGain = Number(document.getElementById("externalGain").value);

    const leftDataPoints = base64ToTimeDataPoints(response.Left, response.Dx, (externalGain * -1));
    const rightDataPoints = base64ToTimeDataPoints(response.Right, response.Dx, (externalGain * -1));

    updateTimeChart(leftDataPoints, rightDataPoints);
}

function refreshAcquisition() {
    const frequency =  document.getElementById("audioGen1Frequency").value;
    makeRequest("GET", "/ThdDb/" + frequency + "/" + measureFrequencyStop, refreshThd);
    makeRequest("GET", "/ThdPct/" + frequency + "/" + measureFrequencyStop, refreshThdPct);
    makeRequest("GET", "/ThdnDb/" + frequency + "/" + measureFrequencyStart + "/" + measureFrequencyStop, refreshThdN)
    makeRequest("GET", "/ThdnPct/" + frequency + "/" + measureFrequencyStart + "/" + measureFrequencyStop, refreshThdNPct)
    makeRequest("GET", "/SnrDb/" + frequency + "/" + measureFrequencyStart + "/" + measureFrequencyStop, refreshSnr);
    makeRequest("GET", "/RmsDbv/" + measureFrequencyStart + "/" + measureFrequencyStop, refreshRms)
    makeRequest("GET", "/PeakDbv/" + measureFrequencyStart + "/" + measureFrequencyStop, refreshPeak)
    makeRequest("GET", "/Phase/Degrees", refreshPhaseDegrees)
    makeRequest("GET", "/Phase/Seconds", refreshPhaseSeconds)

    const fetchFrequencyData = document.querySelector('input[name="fetchFrequencyCheck"]').checked;
    const fetchTimeData = document.querySelector('input[name="fetchTimeCheck"]').checked;

    if (fetchFrequencyData) {
        makeRequest("GET", "/Data/Freq", refreshFrequencyChart)
    }

    if (fetchTimeData) {
        makeRequest("GET", "/Data/Time", refreshTimeChart)
    }
}

function requestsComplete() {
    if (run) {
        doAcquire();
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

function base64ToFloat64Array(base64) {
    const binaryString = window.atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new Float64Array(bytes.buffer);
}

function base64ToFrequencyDataPoints(base64, dx, attenuation) {
    const floatArray = base64ToFloat64Array(base64);
    let dataPoints = [];

    for (let i = 0; i < floatArray.length; i++) {
        const frequency = i * dx;

        if (frequency >= (measureFrequencyStart -1) && frequency <= measureFrequencyStop) {
            dataPoints.push( {x: frequency, y: amplitudeTodBV(floatArray[i]) + attenuation} );
        }
    }

    return dataPoints;
}

function base64ToTimeDataPoints(base64, dx, attenuation) {
    const ratio = dbToVolt(attenuation);
    const floatArray = base64ToFloat64Array(base64);
    let dataPoints = [];

    for (let i = 0; i < floatArray.length; i++) {
        const time = i * dx;

        if (time > maxTimeData) {
            break;
        }

        dataPoints.push( {x: time, y: floatArray[i] * ratio} );
    }

    return dataPoints;
}

function addToAverageList(list, item) {
    list.push(item);

    if (list.length > avgLimit) {
        list.shift();
    }
}

function getAverageValueFromList(list) {
    let sum = 0.0;

    for (let i = 0; i < list.length; i++) {
        sum += Number(list[i]);
    }

    return sum / list.length;
}

function findPeakFrequency(dataPoints) {
    let peakAmplitude = -1000;
    let peakFrequency = 0;

    for (let i = 0; i < dataPoints.length; i++) {
        const dataPoint = dataPoints[i];

        if (dataPoint.y > peakAmplitude) {
            peakAmplitude = dataPoint.y;
            peakFrequency = dataPoint.x;
        }
    }

    return peakFrequency;
}

function disableButtonsDuringAcquire() {
    document.getElementById("setSettingsBtn").disabled = true;
    document.getElementById("acquireBtn").disabled = true;
    document.getElementById("runBtn").disabled = true;
}

function enableButtonsAfterAcquire() {
    document.getElementById("setSettingsBtn").disabled = false;
    document.getElementById("acquireBtn").disabled = false;
    document.getElementById("runBtn").disabled = false;
}

function updateElementsEnabled(elements, enable) {
    for (let i = 0; i < elements.length; i++) {
        if (enable) {
            elements[i].classList.remove("text-black-50");
        } else {
            elements[i].classList.add("text-black-50");
        }
    }
}
