let amplitudeChart;
Chart.platform.disableCSSInjection = true;

function initializeCharts() {
    amplitudeChart = initializeFrequencyChart('amplitudeChart');
}

function addPoint(leftPoint, rightPoint) {
    amplitudeChart.data.datasets[0].data.push(leftPoint);
    amplitudeChart.data.datasets[1].data.push(rightPoint);
    amplitudeChart.update();
}

function setChannels(leftChannel, rightChannel) {
    amplitudeChart.data.datasets[0].hidden = !leftChannel;
    amplitudeChart.data.datasets[1].hidden = !rightChannel;
    amplitudeChart.update();
}

function showData(title, yLabelLeft, yLabelRight, leftChannelData, rightChannelData, yLabelRightCallback) {
    amplitudeChart.options.title.text = title;
    amplitudeChart.options.scales.yAxes[0].scaleLabel.labelString = yLabelLeft;
    amplitudeChart.options.scales.yAxes[1].scaleLabel.labelString = yLabelRight;
    amplitudeChart.options.scales.yAxes[1].ticks.userCallback = yLabelRightCallback;
    amplitudeChart.options.scales.yAxes[1].display = yLabelRight !== null;
    amplitudeChart.data.datasets[0].data = leftChannelData;
    amplitudeChart.data.datasets[1].data = rightChannelData;
    amplitudeChart.update();
    amplitudeChart.resetZoom();
}

function resetZoom() {
    amplitudeChart.resetZoom();
}

function resetCharts() {
    amplitudeChart.data.datasets[0].data = [];
    amplitudeChart.data.datasets[1].data = [];
    amplitudeChart.update();
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
                display: true,
                text: "Gain",
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
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        let label = data.datasets[tooltipItem.datasetIndex].label || '';

                        if (label) {
                            label += ': ';
                        }

                        label += tooltipItem.yLabel;

                        if (typeof amplitudeChart.options.scales.yAxes[1].ticks.userCallback === "function") {
                            label += " / ";
                            label += amplitudeChart.options.scales.yAxes[1].ticks.userCallback(tooltipItem.yLabel);
                        }

                        return label;
                    }
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
                }],
                yAxes: [{
                    id:"y-axis-1",
                    type: 'linear',
                    position: 'left',
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
                }, {
                    id:"y-axis-2",
                    type: 'linear',
                    display: true,
                    position: 'right',
                    afterDataLimits: function (axis) {
                        // Copy values from left to right to sync labels
                        axis.min = axis.chart.scales['y-axis-1'].min;
                        axis.max = axis.chart.scales['y-axis-1'].max;
                    },
                    ticks: {
                        fontColor: "rgba(255, 255, 255, 0.9)"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '%',
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
