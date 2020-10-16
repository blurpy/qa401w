let leftChart;

function initializeChart() {
    const ctx = document.getElementById('leftChart');

    leftChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "Left channel",
                fill: false,
                pointRadius: 0,
                borderWidth: 1,
                borderColor: 'rgb(255,227,21)',
                data: [{ x: 1, y: 0 }, { x: 24000, y: -150 }],
            }]
        },
        options: {
            responsive: false,
            title: {
                display: true,
                text: 'Left',
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
}
