let run = false;
let currentRequests = 0;
let fetchFrequencyData = true;
let fetchTimeData = false;
const basePath = "http://localhost:8080/http://localhost:9401";

onDOMContentLoaded = (function() {
    registerButtons();
    initializeCharts();

    makeRequest("GET", "/Status/Version", refreshStatusVersion);
})();

function registerButtons() {
    document.getElementById("acquireSettingsBtn").addEventListener('click', clickAcquireSettings);
    document.getElementById("updateViewBtn").addEventListener('click', clickUpdateView);
    document.getElementById("resetZoomBtn").addEventListener('click', clickResetZoom);
    document.getElementById("acquireBtn").addEventListener('click', clickAcquire);
    document.getElementById("runBtn").addEventListener('click', clickRun);
    document.getElementById("stopBtn").addEventListener('click', clickStop);
}

function clickAcquireSettings() {
    setBufferSize();
    setAttenuator();
    setGenerator1();
    setGenerator2();
    setWindowType();
    setSampleRate();
    setRoundFrequencies();
    setFetchData();
}

function setBufferSize() {
    const bufferSizeChoice = document.querySelector('#bufferSizeSelect option:checked').value;
    makeRequest("PUT", "/Settings/BufferSize/" + bufferSizeChoice, function() {});
}

function setAttenuator() {
    const attenuatorChoice = document.querySelector('input[name="attenuatorChoice"]:checked').value;
    makeRequest("PUT", "/Settings/Input/Max/" + attenuatorChoice, function() {});
}

function setGenerator1() {
    const checked = document.querySelector('input[name="audioGen1Check"]').checked;
    const enabled = (checked ? "On" : "Off");
    const frequency =  document.getElementById("audioGen1Frequency").value;
    const amplitude =  document.getElementById("audioGen1Amplitude").value;
    makeRequest("PUT", "/Settings/AudioGen/Gen1/" + enabled + "/" + frequency + "/" + amplitude, function() {});
}

function setGenerator2() {
    const checked = document.querySelector('input[name="audioGen2Check"]').checked;
    const enabled = (checked ? "On" : "Off");
    const frequency =  document.getElementById("audioGen2Frequency").value;
    const amplitude =  document.getElementById("audioGen2Amplitude").value;
    makeRequest("PUT", "/Settings/AudioGen/Gen2/" + enabled + "/" + frequency + "/" + amplitude, function() {});
}

function setWindowType() {
    const windowTypeChoice = document.querySelector('#windowTypeSelect option:checked').value;
    makeRequest("PUT", "/Settings/Window/" + windowTypeChoice, function() {});
}

function setSampleRate() {
    const sampleRate = document.querySelector('input[name="sampleRateChoice"]:checked').value;
    makeRequest("PUT", "/Settings/SampleRate/" + sampleRate, function() {});
}

function setRoundFrequencies() {
    const checked = document.querySelector('input[name="roundFrequenciesCheck"]').checked;
    const enabled = (checked ? "On" : "Off");
    makeRequest("PUT", "/Settings/RoundFrequencies/" + enabled, function() {});
}

function setFetchData() {
    fetchFrequencyData = document.querySelector('input[name="fetchFrequencyCheck"]').checked;
    fetchTimeData = document.querySelector('input[name="fetchTimeCheck"]').checked;

    if (!fetchFrequencyData) {
        updateFrequencyChart([], []);
    }

    if (!fetchTimeData) {
        updateTimeChart([], []);
    }
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
    } else if (channel === "right") {
        setChannels(false, true);
    } else if (channel === "both") {
        setChannels(true, true);
    }
}

function clickAcquire() {
    run = false;
    currentRequests = 0;
    doAcquire();
}

function clickRun() {
    run = true;
    currentRequests = 0;
    doAcquire();
}

function clickStop() {
    run = false;
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
}

function refreshThdPct(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdPctLeft").innerText = Number(response.Left).toFixed(6);
    document.getElementById("thdPctRight").innerText = Number(response.Right).toFixed(6);
}

function refreshThdN(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdnLeft").innerText = Number(response.Left).toFixed(3);
    document.getElementById("thdnRight").innerText = Number(response.Right).toFixed(3);
}

function refreshThdNPct(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdnPctLeft").innerText = Number(response.Left).toFixed(6);
    document.getElementById("thdnPctRight").innerText = Number(response.Right).toFixed(6);
}

function refreshRms(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("rmsLeft").innerText = Number(response.Left).toFixed(3);
    document.getElementById("rmsRight").innerText = Number(response.Right).toFixed(3);
}

function refreshPeak(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("peakLeft").innerText = Number(response.Left).toFixed(3);
    document.getElementById("peakRight").innerText = Number(response.Right).toFixed(3);
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

function refreshCharts(httpRequest) {
    const attenuatorChoice = document.querySelector('input[name="attenuatorChoice"]:checked').value;
    const attenuation = (attenuatorChoice === "26" ? 20 : 0);

    const response = JSON.parse(httpRequest.responseText);
    const leftDataPoints = base64ToDataPoints(response.Left, response.Dx, attenuation);
    const rightDataPoints = base64ToDataPoints(response.Right, response.Dx, attenuation);

    updateFrequencyChart(leftDataPoints, rightDataPoints);
}

function refreshTimeCharts(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    const leftDataPoints = base64ToTimeDataPoints(response.Left, response.Dx);
    const rightDataPoints = base64ToTimeDataPoints(response.Right, response.Dx);

    updateTimeChart(leftDataPoints, rightDataPoints);
}

function refreshAcquisition() {
    const frequency =  document.getElementById("audioGen1Frequency").value;
    makeRequest("GET", "/ThdDb/" + frequency + "/20000", refreshThd);
    makeRequest("GET", "/ThdPct/" + frequency + "/20000", refreshThdPct);
    makeRequest("GET", "/ThdnDb/" + frequency + "/20/20000", refreshThdN)
    makeRequest("GET", "/ThdnPct/" + frequency + "/20/20000", refreshThdNPct)
    makeRequest("GET", "/RmsDbv/20/20000", refreshRms)
    makeRequest("GET", "/PeakDbv/20/20000", refreshPeak)
    makeRequest("GET", "/Phase/Degrees", refreshPhaseDegrees)
    makeRequest("GET", "/Phase/Seconds", refreshPhaseSeconds)

    if (fetchFrequencyData) {
        makeRequest("GET", "/Data/Freq", refreshCharts)
    }

    if (fetchTimeData) {
        makeRequest("GET", "/Data/Time", refreshTimeCharts)
    }
}

function requestsComplete() {
    if (run) {
        doAcquire();
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
                alert('There was a problem with the request.');
            }
        }
    };

    httpRequest.open(method, basePath + path);
    httpRequest.send();
}

function amplitudeTodBV(amplitude) {
    return 20 * Math.log(amplitude) / Math.LN10;
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

function base64ToDataPoints(base64, dx, attenuation) {
    const floatArray = base64ToFloat64Array(base64);
    let dataPoints = [];

    for (let i = 0; i < floatArray.length; i++) {
        const frequency = i * dx;

        if (frequency >= 19 && frequency <= 20000) {
            dataPoints.push( {x: frequency, y: amplitudeTodBV(floatArray[i]) + attenuation} );
        }
    }

    return dataPoints;
}

function base64ToTimeDataPoints(base64, dx) {
    const floatArray = base64ToFloat64Array(base64);
    let dataPoints = [];

    for (let i = 0; i < floatArray.length; i++) {
        const time = i * dx;

        dataPoints.push( {x: time, y: floatArray[i]} );
    }

    return dataPoints;
}
