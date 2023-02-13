$(document).ready(function () {

Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// function to get random colors given a number of colors
function getRandomColors(numColors, opacity = 1) {
    var colors = [];
    for (var i = 0; i < numColors; i++) {
        var color = [];
        for (var j = 0; j < 3; j++) {
            color.push(Math.floor(Math.random() * 256));
        }
        colors.push('rgba(' + color.join(',') + ',' + opacity + ')');
    }
    return colors;
}

// resize the canvas when the window is resized
function resizeCanvas() {
    var canvas = document.querySelector('#myChart');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
}

// resize the canvas when the window is resized
window.addEventListener('resize', resizeCanvas);
    
function getTotalMonth() {
    $.ajax({
        url: '/stats/getTotalMonth',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(data);

            const graphData = {
                labels: data.months,
                datasets: [{
                label: 'Monthly Total',
                data: data.totals,
                backgroundColor: getRandomColors(data.totals.length, 0.7),
                borderWidth: 1
            }]
            };

            new Chart(
                document.querySelector('#myChart'),
                {
                    type: 'bar',
                    data: graphData,
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    },
                }
            );
        }
    });
}

function mixedChart1(data){
    arr = []
    // loop through the data
    for (var i = 0; i < Object.keys(data).length; i++) {
        // add the data to the object
        console.log(data[Object.keys(data)[i]]);
        obj = {
            type: 'line',
            label: Object.keys(data)[i],
            data: data[Object.keys(data)[i]],
            // borderColor: getRandomColors(1)[0],
            // borderWidth: 2,
            // fill: false,
    }
    // add the object to the array
    arr.push(obj);
}
return arr;
}

function totalDayMonth() {
    $.ajax({
        url: '/stats/totalDayMonth',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            // draw a line chart
            // new Chart(
            //     document.querySelector('#myChart2'),
            //     {
            //         type: 'line',
            //         data: {
            //             labels : data['2022-09'].map(function (e) {
            //                 return e.x;
            //             }),
            //             datasets: [{
            //                 data: data['2022-09'],
            //             },
            //         {
            //             data: data['2022-10'],
            //         }]
            //         },
            //         options: {
            //             scales: {
            //                 x: {
            //                     type: 'time',
            //                     time: {
            //                         unit: 'month'
            //                     }
            //                 }
            //             }
            //         },
            //     }
            // );
            
            // console.log(mixedChart1(data));
            new Chart(
                document.querySelector('#myChart2'),
                {
                    data:{
                        datasets: mixedChart1(data)    
                    },
                    options: {
                        scales: {
                            x: {
                                // linear frm 0 to 31
                                type: 'linear',
                                min: 1,
                                max: 31,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
        }
    });
}

getTotalMonth();
// totalDayMonth();


});


