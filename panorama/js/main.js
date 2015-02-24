(function($, window, document) {

    var options = {
        //General
        displayRays: true,
        displayPeaks: true,
        displayAltitudeHierarchy: false,
        connectTheDots: false,
        rigiAltitude: 1798,
        outerPadding: 20,
        //Center Circle
        centerCircleStrokeColor: 'grey',
        centerCircleStrokeWidth: 0.3,
        centerCircleRadius: 50,
        //Rays
        rayStrokeColor: 'grey',
        rayStrokeColorTaller: '#ff9999',
        rayStrokeColorSmaller: '#9999ff',
        rayStrokeWidth: 0.1,
        //Peaks
        peakStrokeColor: 'grey',
        peakStrokeWidth: 0.3,
        peakRadius: 3,
        //ConnectTheDots Path
        connectTheDotsColor: '#ffcccc',
        connectTheDotsWidth: 0.3,
        connectTheDotsSmoothPath: true
    };

    var data;

    var sizes = {};

    var maxDistance = function(dataArray) {
        var heightsArray = dataArray.map(function(el) {
            return el.distance_km;
        });
        return Math.max.apply(Math, heightsArray);
    }

    var resizeHandler = function(evt) {
        console.log('resized, calling draw ...');
        sizes.maxExtent = (paper.view.viewSize._width >= paper.view.viewSize._height) ? paper.view.viewSize._height / 2 : paper.view.viewSize._width / 2;
        sizes.maxRayLength = sizes.maxExtent - options.centerCircleRadius - options.outerPadding;

        draw(data);
    }

    var initDraw = function() {
        sizes.maxDistance = maxDistance(data);
        // Create an empty project and a view for the canvas:
        var canvas = document.getElementById('myCanvas');
        paper.setup(canvas);
        paper.view.onResize = resizeHandler;
        
        resizeHandler();


    }

    var init = function() {
        $.getJSON("data/gipfel.json", function(_data) {
            data = _data;
            initDraw();
        });
    }

    $(function() {
        init();
    });





    /*=========================================
    =            Main Draw Routine            =
    =========================================*/
    function draw(data) {
            paper.view.onFrame = function(){
            peaksnraysGroup.rotate(0.05 , paper.view.center);
        }
        console.log('draw');

        paper.project.clear();
        // Create a Paper.js Path to draw a line into it:

        var centerPoint = paper.view.center;

        var innerPaddingVector = new paper.Point;
        innerPaddingVector.length = options.centerCircleRadius;

        //Connect the dots
        if (options.connectTheDots) {
            var connectTheDotsPath = new paper.Path;
            connectTheDotsPath.strokeColor = options.connectTheDotsColor;
            connectTheDotsPath.fillColor = options.connectTheDotsColor;
            connectTheDotsPath.strokeWidth = options.connectTheDotsWidth;
        }

        //Iterate data and draw peaks and rays
        var rays = [];
        var peaks = [];
        var peaksnrays = [];
        var peaksnraysGroup = new paper.Group;

        var destVector = new paper.Point;
        for (var i = data.length - 1; i >= 0; i--) {


            destVector.angle = data[i].degrees;
            innerPaddingVector.angle = data[i].degrees;
            destVector.length = data[i].distance_km / sizes.maxDistance * sizes.maxRayLength;
            var destPoint = centerPoint.add(innerPaddingVector).add(destVector);

            if (options.displayRays) {
                var ray = new paper.Path();
                ray.strokeColor = !options.displayAltitudeHierarchy ? options.rayStrokeColor : data[i].altitude > options.rigiAltitude ? options.rayStrokeColorTaller : options.rayStrokeColorSmaller;
                ray.strokeWidth = options.rayStrokeWidth;
                ray.moveTo(centerPoint.add(innerPaddingVector));
                ray.lineTo(destPoint);
                rays.push(ray);
                peaksnraysGroup.addChildren(rays);
            }

            if (options.connectTheDots) {
                connectTheDotsPath.add(new paper.Point(destPoint));
            }

            if (options.displayPeaks) {
                var peakCircle = new paper.Path.Circle(destPoint, options.peakRadius);
                peakCircle.strokeColor = options.peakStrokeColor;
                peakCircle.strokeWidth = options.peakStrokeWidth;
                peaks.push(peakCircle);
                peaksnraysGroup.addChildren(peaks);
            }
        };


        if (options.connectTheDots) {
            connectTheDotsPath.closed = true;
            connectTheDotsPath.fullySelected = false;
            if (options.connectTheDotsSmoothPath) {
                connectTheDotsPath.smooth();
            }

        }

        //Draw center circle aka Rigi
        var centerCircle = new paper.Path.Circle(centerPoint, options.centerCircleRadius);
        centerCircle.strokeColor = options.centerCircleStrokeColor;
        centerCircle.strokeWidth = options.centerCircleStrokeWidth;

        //Draw upward beam
        var beamDest = centerPoint.add(new paper.Point(sizes.maxExtent - options.outerPadding, 0));
        var beam = new paper.Path();
        beam.strokeColor = 'red';
        beam.strokeWidth = 1;
        beam.moveTo(centerPoint.add(innerPaddingVector));
        beam.lineTo(beamDest);
        //


        //Rotate main layer to make o°=NORTH
        paper.project.activeLayer.rotate(-90, paper.view.center);

        //Invoke draw

        paper.view.draw();

    }


}(window.jQuery, window, document));