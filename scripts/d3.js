"use strict"
window.onload = function () {
    // preset chart width and height
    const margin = 50,
        width = 500 - margin,
        height = 500 - margin,
        radius = 4;

    // append svg to the div element
    const svg = d3.select('#visualization').append('svg')
        .attr('width', width + margin)
        .attr('height', height + margin)
        .append('g')
        .attr('transform', 'translate(' + margin + ',' + margin + ')');

    // load data from an external file
    d3.csv('baseball_data.csv', function (data) {
        //console.table(data);
        // format data to number
        data.height = +data.height;
        data.weight = +data.weight;
        data.avg = +data.avg;
        data.HR = +data.HR;

        return data;
    }).then(draw).catch(function (error) {
        console.log(error);
    });

    function draw(data) {

        const optionsY = ['avg', 'HR'];

        const optionsX = ['height', 'weight', 'handedness'];

        // keep track of current options for x and y axis
        let optionY = optionsY[0];
        let optionX = optionsX[0];

        // group data by physical caracteristics
        // to reduce number of showing circles
        function nestData(data) {
            const nested = d3.nest()
                // group by y axis value
                .key(function (d) {
                    return d[optionY];
                })
                // group by x axis value
                .key(function (d) {
                    return d[optionX];
                })
                // put nested data into one object
                .rollup(function (leaves) {
                    //console.log(leaves);
                    let nestedY = d3.map();
                    let nestedX = d3.map();
                    let nestedNames = [];
                    leaves.forEach(function (d) {
                        // extract the commong grouped y axis value
                        nestedY.set('optionY', d[optionY]);
                        // extract the commong grouped y axis value
                        nestedX.set('optionX', d[optionX]);
                        // add grouped players names to an array
                        nestedNames.push(d.name);
                    })

                    return {
                        'optionY': nestedY.values()[0],
                        'optionX': nestedX.values()[0],
                        'names': nestedNames,
                        'x': xAxis(nestedX.values()[0]),
                        'y': yAxis(nestedY.values()[0])

                    }
                })
                .entries(data);
            return nested;
        }

        let yAxis;

        function drawYAxis(optionY) {
            // get domain range for scales 
            // extent returns min and max

            const extent = d3.max(data, function (d) {
                return d[optionY];
            });

            // create y axis mapping data to pixels
            yAxis = d3.scaleLinear()
                .range([height - margin, 0])
                .domain([0, extent]);

            // draw y-axis
            svg.append('g')
                .call(d3.axisLeft(yAxis))
                .attr('id', 'y-Axis')
                // add text label
                .append('text')
                .attr('x', -10)
                .attr('fill', 'black')
                .text(optionY)
                .attr('class', 'axis-label');
        }

        let xAxis;

        function drawXAxis() {

            if (optionX === 'handedness') {
                // create x axis mapping handedness data to pixels  
                xAxis = d3.scaleBand()
                    .range([0, width])
                    .domain(data.map(function (d) {
                        return d[optionX];
                    }))

                    .paddingOuter([1])
                    .paddingInner([1]);
            } else {
                const extent = d3.extent(data, function (d) {
                    return d[optionX];
                });

                // create x axis mapping data to pixels
                xAxis = d3.scaleLinear()
                    .range([0, width - margin])
                    .domain(extent)
            }

            // draw x-axis
            svg.append('g')
                .attr('transform', 'translate(0,' + (height - margin) + ')')
                .call(d3.axisBottom(xAxis))
                .attr('id', 'x-Axis')
                .append('text')
                .attr('x', width - margin + 25)
                .attr('y', 15)
                .attr('fill', 'black')
                .text(optionX)
                .attr('class', 'axis-label');
        }

        function drawChart(optionY, optionX) {

            let nestedData = [];
            // flatten the data to extract nested grouped data
            nestData(data, optionY, optionX).forEach(function (d) {
                d.values.forEach(function (d) {
                    nestedData.push(d.value);
                })
            });
            // console.log(nestedData);

            svg.selectAll('circle')
                .data(nestedData)
                .enter()
                .append('circle')
                .attr('cx', function (d) {
                    //console.log(d);
                    return xAxis(d['optionX']);
                })
                .attr('cy', function (d) {
                    return yAxis(d['optionY']);
                })
                .attr('r', radius)
                .attr('class', 'points');

            // run force simulation
            simulation(nestedData);
        }

        function createButtons() {
            let yButtons = d3.select('#buttons')
                .append('div')
                .attr('class', 'y-buttons');

            yButtons.append('p')
                .attr('class', 'btn-text')
                .text('Choose Y-Axis Domain:')

            yButtons = yButtons.selectAll('div')
                .data(optionsY)
                .enter()
                .append('div')
                .text(function (d) {
                    return d
                })
                .attr('class', 'btn');

            yButtons.on('click', function (d) {
                // remove active button styling
                d3.selectAll('.y-buttons .btn')
                  .classed('btn-active', false);
                // add active button styling to current selection
                d3.select(this)
                  .classed('btn-active', true);
                // set current data option
                optionY = d;
                // remove all data
                clearCircles();
                // remove current axis
                d3.select('#y-Axis').remove();
                // draw new axis
                drawYAxis(d);
                // draw new chart
                drawChart(d, optionX);
            });


            let xButtons = d3.select('#buttons')
                .append('div')
                .attr('class', 'x-buttons');

            xButtons.append('p')
                .attr('class', 'btn-text')
                .text('Choose X-Axis Domain:')

            xButtons = xButtons.selectAll('div')
                .data(optionsX)
                .enter()
                .append('div')
                .text(function (d) {
                    return d;
                })
                .attr('class', 'btn');

            xButtons.on('click', function (d) {
                // remove active button styling
                d3.selectAll('.x-buttons .btn')
                  .classed('btn-active', false);
                // add active button styling to current selection
                d3.select(this)
                  .classed('btn-active', true);
                optionX = d;
                clearCircles();
                d3.select('#x-Axis').remove();
                drawXAxis(d);
                drawChart(optionY, d);
            });

            // activate default axis buttons styling
            d3.selectAll('.btn:first-of-type')
                .classed('btn-active', true);
        }

        // draw axis
        drawYAxis(optionY);
        drawXAxis(optionX);

        // draw data
        drawChart(optionY, optionX);
        createButtons();


        // set up force to show data collisions
        function simulation(nestedData) {
            const simulation = d3.forceSimulation(nestedData)
                .force('collide', d3.forceCollide().radius(function (d) {
                    return radius * .4;
                }))
                .on('tick', ticked);
            return simulation;
        }
        //console.log(simulation);

        // run force on circles to display data collisions
        function ticked(e) {
            svg.selectAll('circle')
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                });
        }

        function clearCircles() {
            d3.selectAll('circle').remove();
        }





    }

};