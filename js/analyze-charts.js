let frequencyChart;
let timeChart;
Chart.platform.disableCSSInjection = true;

function initializeCharts() {
    frequencyChart = initializeFrequencyChart('frequencyChart');
    timeChart = initializeTimeChart('timeChart');
}

function updateFrequencyChart(leftDataPoints, rightDataPoints) {
    frequencyChart.data.datasets[0].data = leftDataPoints;
    frequencyChart.data.datasets[1].data = rightDataPoints;
    frequencyChart.update();
}

function updateTimeChart(leftDataPoints, rightDataPoints) {
    timeChart.data.datasets[0].data = leftDataPoints;
    timeChart.data.datasets[1].data = rightDataPoints;
    timeChart.update();
}

function setChannels(leftChannel, rightChannel) {
    frequencyChart.data.datasets[0].hidden = !leftChannel;
    frequencyChart.data.datasets[1].hidden = !rightChannel;
    frequencyChart.update();

    timeChart.data.datasets[0].hidden = !leftChannel;
    timeChart.data.datasets[1].hidden = !rightChannel;
    timeChart.update();
}

function showFrequencyChart() {
    document.getElementById("frequencyChart").classList.remove("d-none");
    document.getElementById("timeChart").classList.add("d-none");
}

function showTimeChart() {
    document.getElementById("frequencyChart").classList.add("d-none");
    document.getElementById("timeChart").classList.remove("d-none");
}

function resetZoom() {
    frequencyChart.resetZoom();
    timeChart.resetZoom();
}

function initializeFrequencyChart(chartId) {
    const ctx = document.getElementById(chartId);

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "Left",
                fill: false,
                pointRadius: 0,
                borderWidth: 1,
                borderColor: 'rgb(255,227,21)',
                // data: [{ x: 20, y: 0 }, { x: 20000, y: -160 }],
            }, {
                label: "Right",
                hidden: true,
                fill: false,
                pointRadius: 0,
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
                line: {
                    tension: 0 // disables bezier curves
                }
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
                        userCallback: function(tick) {
                            const remain = tick / (Math.pow(10, Math.floor(Chart.helpers.math.log10(tick))));
                            if (remain === 1 || remain === 2 || remain === 5) {
                                return tick.toString();
                            }
                            return '';
                        },
                        min: 20,
                        max: 20000,
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
                        labelString: 'dBV',
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

function initializeTimeChart(chartId) {
    const ctx = document.getElementById(chartId);

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "Left",
                fill: false,
                pointRadius: 0,
                borderWidth: 1,
                borderColor: 'rgb(255,227,21)',
                // data: [{ x: 20, y: 0 }, { x: 20000, y: -160 }],
            }, {
                label: "Right",
                hidden: true,
                fill: false,
                pointRadius: 0,
                borderWidth: 1,
                borderColor: 'rgb(255,21,21)',
                // data: [{ x: 20, y: 0 }, { x: 20000, y: -160 }],
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
                line: {
                    tension: 0 // disables bezier curves
                }
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
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        // userCallback: function(tick) {
                        //     const remain = tick / (Math.pow(10, Math.floor(Chart.helpers.log10(tick))));
                        //     if (remain === 1 || remain === 2 || remain === 5) {
                        //         return tick.toString();
                        //     }
                        //     return '';
                        // },
                        // min: 20,
                        // max: 20000,
                        fontColor: "rgba(255, 255, 255, 0.9)"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Time',
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
                        // min: -1,
                        // max: 1,
                        fontColor: "rgba(255, 255, 255, 0.9)"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Voltage',
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
