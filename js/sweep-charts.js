let frequencyChart;
Chart.platform.disableCSSInjection = true;

function initializeCharts() {
    frequencyChart = initializeFrequencyChart('frequencyChart');
}

function addPoint(leftPoint, rightPoint) {
    frequencyChart.data.datasets[0].data.push(leftPoint);
    frequencyChart.data.datasets[1].data.push(rightPoint);
    frequencyChart.update();
}

function setChannels(leftChannel, rightChannel) {
    frequencyChart.data.datasets[0].hidden = !leftChannel;
    frequencyChart.data.datasets[1].hidden = !rightChannel;
    frequencyChart.update();
}

function showData(label, leftChannelData, rightChannelData) {
    frequencyChart.options.scales.yAxes[0].scaleLabel.labelString = label;
    frequencyChart.data.datasets[0].data = leftChannelData;
    frequencyChart.data.datasets[1].data = rightChannelData;
    frequencyChart.update();
    frequencyChart.resetZoom();
}

function resetZoom() {
    frequencyChart.resetZoom();
}

function resetCharts() {
    frequencyChart.data.datasets[0].data = [];
    frequencyChart.data.datasets[1].data = [];
    frequencyChart.update();
}

function toPoint(frequency, value) {
    return {x: frequency, y: value};
}

function initializeFrequencyChart(chartId) {
    const ctx = document.getElementById(chartId);

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "Left",
                fill: false,
                // pointRadius: 1,
                borderWidth: 1,
                borderColor: 'rgb(255,227,21)',
                // data: [{ x: 20, y: 0 }, { x: 20000, y: -160 }],
            }, {
                label: "Right",
                hidden: true,
                fill: false,
                // pointRadius: 0,
                borderWidth: 1,
                borderColor: 'rgb(255,21,21)',
                // data: [{ x: 20000, y: 0 }, { x: 20, y: -160 }],
            }]
        },
        options: {
            responsive: true,
            title: {
                display: false,
                text: "title",
                fontColor: "rgba(255, 255, 255, 0.9)"
            },
            animation: {
                duration: 0 // general animation time
            },
            elements: {
                // line: {
                //     tension: 0 // disables bezier curves
                // }
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    fontColor: "rgba(255, 255, 255, 0.9)"
                }
            },
            scales: {
                xAxes: [{
                    type: 'logarithmic',
                    position: 'bottom',
                    ticks: {
                        userCallback: function (tick) {
                            const remain = tick / (Math.pow(10, Math.floor(Chart.helpers.math.log10(tick))));
                            if (remain === 1 || remain === 2 || remain === 5) {
                                return tick.toString();
                            }
                            return '';
                        },
                        min: 20,
                        // max: 20000,
                        fontColor: "rgba(255, 255, 255, 0.9)"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Hz',
                        fontColor: "rgba(255, 255, 255, 0.9)"
                    },
                    gridLines: {
                        display: true,
                        borderDash: [2],
                        color: "rgba(255, 255, 255, 0.5)"
                    },
                }],
                yAxes: [{
                    type: 'linear',
                    ticks: {
                        fontColor: "rgba(255, 255, 255, 0.9)"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'dB',
                        fontColor: "rgba(255, 255, 255, 0.9)"
                    },
                    gridLines: {
                        display: true,
                        borderDash: [2],
                        color: "rgba(255, 255, 255, 0.5)"
                    },
                }]
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        enabled: true,
                        mode: 'x',
                    }
                }
            }
        }
    });
}
