let leftChart;
let rightChart;

function initializeCharts() {
    leftChart = initializeChart('leftChart', "Left");
    rightChart = initializeChart('rightChart', "Right");
}

function updateLeftChart(dataPoints) {
    leftChart.data.datasets[0].data = dataPoints;
    leftChart.update();
}

function updateRightChart(dataPoints) {
    rightChart.data.datasets[0].data = dataPoints;
    rightChart.update();
}

function initializeChart(chartId, title) {
    const ctx = document.getElementById(chartId);

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "Left channel",
                fill: false,
                pointRadius: 0,
                borderWidth: 1,
                borderColor: 'rgb(255,227,21)',
                data: [{ x: 20, y: 0 }, { x: 20000, y: -160 }],
            }]
        },
        options: {
            responsive: false,
            title: {
                display: true,
                text: title,
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
                display: false,
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
                            const remain = tick / (Math.pow(10, Math.floor(Chart.helpers.log10(tick))));
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
            }
        }
    });

    return chart;
}
