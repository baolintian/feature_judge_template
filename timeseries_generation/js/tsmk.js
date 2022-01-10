// Get the size of teh div containing the plot
var divWidth = $('#canvas').width();
var divHeight = divWidth/2.5;

/* 将时间戳格式化为yyyy-MM-dd hh:mm:ss格式，其它格式可自行更改 */
function formatTimeMills(timeMills){
    var date = new Date(timeMills);
	var timeStr = date.getFullYear() + "-";
	if (date.getMonth() < 9)
    { // 月份从0开始的
		timeStr += '0';
	}
	timeStr += date.getMonth() + 1 + "-";
	timeStr += date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate();
	timeStr += ' ';
	timeStr += date.getHours() < 10 ? ('0' + date.getHours()) : date.getHours();
	timeStr += ':';
	timeStr += date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes();
	timeStr += ':';
	timeStr += date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds();
	return timeStr;
}


function create_canvas(start_time, end_time, y_low, y_up, y_type){

	// Define the margin and sizes of the plotting area
	var margin = {top: 20, right: 40, bottom: 50, left: 50},
		width = divWidth - margin.left - margin.right,
		height = divHeight - margin.top - margin.bottom;

	// Scales for X and Y axes
	x = d3.scale.linear().domain([new Date(start_time), new Date(end_time)]).range([0, width]);
	if(y_type == "linear"){
		y = d3.scale.linear().domain([y_low, y_up]).range([height, 0]);
	}
	else if (y_type == "log"){
		y = d3.scale.log().domain([y_low, y_up]).range([height, 0]);
	}
	else if(y_type == "pow"){
		y = d3.scale.pow().exponent(2).domain([y_low, y_up]).range([height, 0]);
	}
	
	$('#setAxis').removeClass('disabled');
	// X and Y axes
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(4)
		.innerTickSize(-height)
		.outerTickSize(6)
		.tickPadding(10)
		.tickFormat(function(d) { return String(new Date(d).getFullYear())+"."+
										String(new Date(d).getMonth()+1)+"."+
										String(new Date(d).getDate())});


	var yAxisLeft = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(10)
		.innerTickSize(-width)
		.outerTickSize(10)
		.tickPadding(10)
		.tickFormat(function(d) { return d; });

	// The SVG element containing the plot
	var svg = d3.select("#canvas")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", 
		"translate(" + margin.left + "," + margin.top + ")");

	var line = d3.svg.line();

	// Add the rectangle where the data will be drawn
	svg.append("rect")
		.attr("id", "rect")
		.attr("x", 0)
		.attr("y", 0)
		.style("fill", "rgba(255,255,255,0.1)")
		.attr("width", width)
		.attr("height", height);

	// Add the X and Y Axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxisLeft);


	// Define the Object that will contain the data to draw
	// the line
	drawObj = {
		isDown: false,
		dataPoints: [],
		currentPath: null
	};

	// Function called when the mousedown event on the SVG canvas
	// is detected
	svg.on("mousedown", function(){
		var x;
		var offset = $('#rect').offset();
		var posX = offset.left - $(window).scrollLeft(); 
		x = d3.event.x - posX;

		// Consider only events that happens inside the rect,
		// i.e. x > 0
		if(x > 0){

			if(drawObj.dataPoints.length > 0){
				drawObj.dataPoints = [];
				drawObj.currentPath = null;
				d3.selectAll(".currentPath").remove();
				$('#exportCsv').addClass('disabled');
				$('#exportJSON').addClass('disabled');
			}
			drawObj.isDown = true;
		}

		// Block propagation of the event to other elements
		d3.event.preventDefault();
	});

	// Function called when the mousemove event on the SVG canvas
	// is detected
	svg.on("mousemove", function(){
		var x, y;
		var offset = $('#rect').offset();
		var posY = offset.top - $(window).scrollTop();
		var posX = offset.left - $(window).scrollLeft(); 
		x = d3.event.x - posX;
		y = d3.event.y - posY;

		// Consider to draw the point only if the isDown flag
		// has been set and the points are actually inside the rect x > 0
		if (drawObj.isDown && x > 0){

			// Apply constraints to x and y coordinates
			x = Math.max(0, x);
			x = Math.min(x, width);
			y = Math.max(0, y);
			y = Math.min(height, y);

			if(drawObj.dataPoints.length > 0){
			// Impose that x coordinates are monotonically
			// increasing, otherwise skip
			if( x > drawObj.dataPoints[drawObj.dataPoints.length-1][0]){
				drawObj.dataPoints.push([x, y]);
			}  
			}else{
			// First point, don't check for monotonically
			// increasing values
				drawObj.dataPoints.push([x, y]);
			}
			
			// Create the Pah object if not defined
			if (!drawObj.currentPath){
			drawObj.currentPath = svg.append("path")
				.attr("class", "currentPath")
				.style("stroke-width", 2)
				.style("stroke", "#26A65B")
				.style("fill", "none");
			}
			
			// Draw the path
			drawObj.currentPath
			.datum(drawObj.dataPoints)
			.attr("d", line);
			
			// When the point is at the very right, 
			// terminate the line and activate buttons
			if(x >= width - 1.0){
			drawObj.isDown = false;
			$('#exportCsv').removeClass('disabled');
			$('#exportJSON').removeClass('disabled');
			}
		}

		// Block propagation of the event to other elements
		d3.event.preventDefault();
	});

	// Function that is called when the mouseup event on the SVG
	// canvas is detected, i.e. completed to draw a line.
	svg.on("mouseup", function(){
		drawObj.isDown = false;
		if(drawObj.dataPoints.length > 0){
			$('#exportCsv').removeClass('disabled');
			$('#exportJSON').removeClass('disabled');
		}
		d3.event.preventDefault();
	});
}

$(document).ready(function () {
	create_canvas("2016.04.20", "2016.06.30", 10, 1000, "linear");
	// Function taht generates JSON representation of the data
	// and allows to download it
	function exportDataToJson(filename){
	    var jsonData = {};
	    jsonData.times = drawObj.dataPoints.map(function(v){
		    return x.invert(v[0]);
		});
	    jsonData.values = drawObj.dataPoints.map(function(v){
		    return y.invert(v[1]);
		});
	    
	    var data = 'data:application/json;charset=utf-8,' 
		+ encodeURIComponent(JSON.stringify(jsonData));
	    $(this).attr({
		    'download': filename,
			'href': data,
			'target': '_blank'
			});

	}

	// Function taht generates CSV representation of the data
	// and allows to download it
	function exportDataToCsv(filename){
            var colDelim = ',';
	    var rowDelim = '\r\n';
	    
	    var csv = 'time'+colDelim+'value'+rowDelim;
	    drawObj.dataPoints.map(function(v, i){
		    var t = x.invert(v[0]);
		    t = formatTimeMills(new Date(t))
		    var val = y.invert(v[1]);
		    csv += t+colDelim+val+rowDelim;
	    });
	    
	    var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

	    $(this).attr({
			'download': filename,
			    'href': csvData,
			    'target': '_blank'
			    });
	    
	}
	$("#setAxis").on('click', function (event) {
		document.getElementById("canvas").children[0].remove();
		start_time = document.getElementById("start_time").value;
		end_time = document.getElementById("end_time").value;
		y_low = document.getElementById("y_low").value;
		y_up = document.getElementById("y_up").value;
		y_type = document.getElementById("y_type").value;
		create_canvas(start_time, end_time, y_low, y_up, y_type);
	});

	// The events are associated to hyperlinks:
	// don't do event.preventDefault() or return false
	// We actually need this to be a typical hyperlink
	$("#exportCsv").on('click', function (event) {
		if(drawObj.dataPoints.length > 0){
		    exportDataToCsv.apply(this, ['data.csv']);
		}
		
	});
	$("#exportJSON").on('click', function (event) {
		if(drawObj.dataPoints.length > 0){
		    exportDataToJson.apply(this, ['data.json']);		
		}
	});
    
});