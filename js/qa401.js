let run = false;
let currentRequests = 0;
const basePath = "http://localhost:8080/http://localhost:9401";

onDOMContentLoaded = (function() {
    registerButtons();
})();

function registerButtons() {
    document.getElementById("refreshBtn").addEventListener('click', clickRefresh);
    document.getElementById("bufferSizeBtn").addEventListener('click', clickBufferSize);
    document.getElementById("attenuatorBtn").addEventListener('click', clickAttenuator);
    document.getElementById("audioGen1Btn").addEventListener('click', clickGenerator1);
    document.getElementById("audioGen2Btn").addEventListener('click', clickGenerator2);
    document.getElementById("windowTypeBtn").addEventListener('click', clickWindowType);
    document.getElementById("sampleRateBtn").addEventListener('click', clickSampleRate);
    document.getElementById("roundFrequenciesBtn").addEventListener('click', clickRoundFrequencies);
    document.getElementById("acquireBtn").addEventListener('click', clickAcquire);
    document.getElementById("runBtn").addEventListener('click', clickRun);
    document.getElementById("stopBtn").addEventListener('click', clickStop);
}

function clickRefresh() {
    makeRequest("GET", "/Status/Version", refreshStatusVersion);
    makeRequest("GET", "/Status/Connection", refreshStatusConnection);
}

function clickBufferSize() {
    const bufferSizeChoice = document.querySelector('#bufferSizeSelect option:checked').value;
    makeRequest("PUT", "/Settings/BufferSize/" + bufferSizeChoice, function() {});
}

function clickAttenuator() {
    const attenuatorChoice = document.querySelector('input[name="attenuatorChoice"]:checked').value;
    makeRequest("PUT", "/Settings/Input/Max/" + attenuatorChoice, function() {});
}

function clickGenerator1() {
    const checked = document.querySelector('input[name="audioGen1Check"]').checked;
    const enabled = (checked ? "On" : "Off");
    const frequency =  document.getElementById("audioGen1Frequency").value;
    const amplitude =  document.getElementById("audioGen1Amplitude").value;
    makeRequest("PUT", "/Settings/AudioGen/Gen1/" + enabled + "/" + frequency + "/" + amplitude, function() {});
}

function clickGenerator2() {
    const checked = document.querySelector('input[name="audioGen2Check"]').checked;
    const enabled = (checked ? "On" : "Off");
    const frequency =  document.getElementById("audioGen2Frequency").value;
    const amplitude =  document.getElementById("audioGen2Amplitude").value;
    makeRequest("PUT", "/Settings/AudioGen/Gen2/" + enabled + "/" + frequency + "/" + amplitude, function() {});
}

function clickWindowType() {
    const windowTypeChoice = document.querySelector('#windowTypeSelect option:checked').value;
    makeRequest("PUT", "/Settings/Window/" + windowTypeChoice, function() {});
}

function clickSampleRate() {
    const sampleRate = document.querySelector('input[name="sampleRateChoice"]:checked').value;
    makeRequest("PUT", "/Settings/SampleRate/" + sampleRate, function() {});
}

function clickRoundFrequencies() {
    const checked = document.querySelector('input[name="roundFrequenciesCheck"]').checked;
    const enabled = (checked ? "On" : "Off");
    makeRequest("PUT", "/Settings/RoundFrequencies/" + enabled, function() {});
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

function refreshStatusConnection(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("statusConnection").innerText = response.Value;
}

function refreshThd(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdLeft").innerText = response.Left;
    document.getElementById("thdRight").innerText = response.Right;
}

function refreshThdPct(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdPctLeft").innerText = response.Left;
    document.getElementById("thdPctRight").innerText = response.Right;
}

function refreshThdN(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdnLeft").innerText = response.Left;
    document.getElementById("thdnRight").innerText = response.Right;
}

function refreshThdNPct(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("thdnPctLeft").innerText = response.Left;
    document.getElementById("thdnPctRight").innerText = response.Right;
}

function refreshRms(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("rmsLeft").innerText = response.Left;
    document.getElementById("rmsRight").innerText = response.Right;
}

function refreshPeak(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("peakLeft").innerText = response.Left;
    document.getElementById("peakRight").innerText = response.Right;
}

function refreshPhaseDegrees(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("phaseDegreeLeft").innerText = response.Left;
    document.getElementById("phaseDegreeRight").innerText = response.Right;
}

function refreshPhaseSeconds(httpRequest) {
    const response = JSON.parse(httpRequest.responseText);
    document.getElementById("phaseSecondLeft").innerText = response.Left;
    document.getElementById("phaseSecondRight").innerText = response.Right;
}

function refreshAcquisition() {
    document.getElementById("acquireLeftImg").src = basePath + "/Graph/Frequency/In/0#" + new Date().getTime();
    document.getElementById("acquireRightImg").src = basePath + "/Graph/Frequency/In/1#" + new Date().getTime();

    const frequency =  document.getElementById("audioGen1Frequency").value;
    makeRequest("GET", "/ThdDb/" + frequency + "/20000", refreshThd);
    makeRequest("GET", "/ThdPct/" + frequency + "/20000", refreshThdPct);
    makeRequest("GET", "/ThdnDb/" + frequency + "/20/20000", refreshThdN)
    makeRequest("GET", "/ThdnPct/" + frequency + "/20/20000", refreshThdNPct)
    makeRequest("GET", "/RmsDbv/20/20000", refreshRms)
    makeRequest("GET", "/PeakDbv/20/20000", refreshPeak)
    makeRequest("GET", "/Phase/Degrees", refreshPhaseDegrees)
    makeRequest("GET", "/Phase/Seconds", refreshPhaseSeconds)
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
