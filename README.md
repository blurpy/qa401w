# QA401 Web

Simple (unofficial) web interface for usage with the [QA401H](https://github.com/QuantAsylum/QA401H) REST API for the [QA401 Audio Analyzer](https://quantasylum.com/products/qa401-audio-analyzer). This allows a visual interface on Linux.


## Features

Please read the manual for the Windows software to understand how to use the QA401. This app along with the QA401H API offers a lot of the functionality of the Windows software, but is not feature complete.


### Analyze mode

Analyze acquisitions over a frequency range of 20Hz to 20KHz using static settings.

![Screenshot of frequency analysis](img/qa401w-analyze-frequency.png)

* Use single or continuous acquisition.
* Choose to see only left channel, right channel, or both channels.
* Hover over a point in the graph for X, Y values.
* Zoom and pan in the graph to see more details.
* Optionally calculate the average THD of the last 100 acquisitions in continuous mode.
* View up to 0.3 seconds of the recorded waveform as a time series graph. Remember to enable fetching of time data.
 
![Screenshot of time series analysis](img/qa401w-analyze-time.png)


### Sweep mode

Run frequency sweeps and record data at predefined steps along the way.

![Screenshot of sweep mode](img/qa401w-sweep-frequency.png)

* Choose one graph to follow in real time while sweep runs.
* Switch between the different graphs after sweep is finished to view recorded results.


## How to use

1. [Download](https://github.com/QuantAsylum/QA401H/releases) and start QA401H v0.998 or newer.
2. [Download](https://github.com/blurpy/qa401w/archive/main.zip) the code from this repository and open [analyze.html](analyze.html) in the browser.
