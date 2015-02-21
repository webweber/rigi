(function($, window, document) {

	var options = {
        displayRays : false,
        displayAltitudeHierarchy : true,
        connectTheDots : true,

		//Center Circle
		centerCircleStrokeColor: 'red',
		centerCircleStrokeWidth: 0.3,
		centerCircleRadius: 3,
		//Rays
		rayStrokeColor: 'grey',
        rayStrokeColorTaller : '#ff9999',
        rayStrokeColorSmaller : '#9999ff',
		rayStrokeWidth: 0.1,
		//Peaks
		peakStrokeColor: 'grey',
		peakStrokeWidth: 0.3,
		peakRadius: 3,
        //ConnectTheDots Path
        connectTheDotsColor : '#ff9999',
        connectTheDotsWidth: 0.3,

        rigiAltitude : 1798

	};

    var maxDistance = function(dataArray) {
        var heightsArray = dataArray.map(function(el) {
            return el.distance_km;
        });
        return Math.max.apply(Math, heightsArray);
    }
    var minDistance = function(dataArray) {
        var heightsArray = dataArray.map(function(el) {
            return el.distance_km;
        });
        return Math.min.apply(Math, heightsArray);
    }

    var destinationPoints;

    var init = function() {
        $.getJSON("data/gipfel.json", function(_data) {
            draw(_data);
        });
        
    }



    $(function() {
        init();
    });


    function draw(data) {
    	

        var canvas = document.getElementById('myCanvas');
        // Create an empty project and a view for the canvas:
        paper.setup(canvas);

        // Create a Paper.js Path to draw a line into it:
        
        var centerPoint = paper.view.center;
        var paddingVector = new paper.Point;
        paddingVector.length = options.centerCircleRadius;

        if(options.connectTheDots){
            var connectTheDotsPath = new paper.Path;
            connectTheDotsPath.strokeColor = options.connectTheDotsColor;
            connectTheDotsPath.strokeWidth = options.connectTheDotsWidth;
        }
       

        for (var i = data.length - 1; i >= 0; i--) {
        	var destVector = new paper.Point;
        	destVector.angle = data[i].degrees;
        	paddingVector.angle = data[i].degrees;
        	destVector.length = data[i].distance_km*4;

            console.log('destVercotr end '+destVector.endPoint);
        	var destPoint = centerPoint.add(paddingVector).add(destVector);
            if(options.displayRays){
            	var ray = new paper.Path();
            	ray.strokeColor = ! options.displayAltitudeHierarchy ? options.rayStrokeColor : data[i].altitude > options.rigiAltitude ? options.rayStrokeColorTaller : options.rayStrokeColorSmaller;
            	ray.strokeWidth = options.rayStrokeWidth;
            	ray.moveTo(centerPoint.add(paddingVector));
                
            	ray.lineTo(destPoint);
            }

            if(options.connectTheDots){
                         connectTheDotsPath.add(new paper.Point(destPoint));
            }

        	var peakCircle = new paper.Path.Circle(destPoint, options.peakRadius);
        	peakCircle.strokeColor = options.peakStrokeColor;
        	peakCircle.strokeWidth = options.peakStrokeWidth;
        };

        if(options.connectTheDots){
                connectTheDotsPath.closed = true;
                connectTheDotsPath.fullySelected = false;
                connectTheDotsPath.smooth();
        }

        var centerCircle = new paper.Path.Circle(centerPoint, options.centerCircleRadius);
    	centerCircle.strokeColor = options.centerCircleStrokeColor;
    	centerCircle.strokeWidth = options.centerCircleStrokeWidth;


		paper.view.draw();

    }

}(window.jQuery, window, document));