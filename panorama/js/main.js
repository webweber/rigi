(function($, window, document) {

    var options = {
       //Animation
        rotationSpeed: 0.1,
        speakers:['swissgerman','chinese_male'],// possible values = names of 'assets'-subfolders

        //display switches
        displayRays: true,
        displayPeaks: true,
        displayOrbits: true,
        displayAltitudeHierarchy: false,
        connectTheDots: false,

        //general
        rigiAltitude: 1798,
        outerPadding: 20,
        backgroundColor: '#000',
        //Center Circle
        centerCircleStrokeColor: '#666666',
        centerCircleStrokeWidth: 0.3,
        centerCircleRadius: 25,
        //Rays
        rayStrokeColor: 'rgba(102, 102, 102, 0.7)',
        rayStrokeColorTaller: '#ff9999',
        rayStrokeColorSmaller: '#9999ff',
        rayStrokeWidth: 0.2,
        //Peaks
        peakStrokeColor: 'rgba(102, 102, 102, 0.7)',
        peakFillColor: 'rgba(102, 102, 102, 0.7)',
        peakStrokeWidth: 0.6,
        peakRadius: 1.0,
        activePeakMarkerColor: 'red',
        //Beam ( upwards pointing indicator )
        beamColor: 'red',
        beamStrokeWidth: 0.3,
        //ConnectTheDots Path
        connectTheDotsColor: '#ffcccc',
        connectTheDotsWidth: 0.3,
        connectTheDotsSmoothPath: true,
        //Orbits = the concentric circles the dots sit on
        orbitStrokeColor: 'rgba(255, 255, 255, 0.16)',
        orbitStrokeWidth: 0.1
 
    };

    var data;
    // data as assoc. array with degrees as keys
    var degreesdata;

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




    var Soundscape = function() {
        var self = this;
        this.buffers = [];

     //   this.basepath = 'assets/swissgerman/';

        this.extension = '.mp3';

        this.init = function() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            self.context = new AudioContext();

        };

        this.loadSound = function loadDogSound(url, idxSpeaker, idx, isLast) {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';

            req.onload = function() {
                self.context.decodeAudioData(req.response, function(buffer) {
                    if( self.buffers[idx] == undefined){
                        self.buffers[idx] = new Array();
                    }
                    self.buffers[idx][idxSpeaker] = buffer;
                }, function(err) {
                    console.log('decoding error for ' + url);
                });
            }
            req.send();

        }

        this.loadSoundsForData = function(_data) {
            _data.forEach(function(anObject, idx) {
                var soundUrl, idxSpeaker;
                if (undefined != anObject.filename) {

                   // var randInd = Math.floor((Math.random() * options.speakers.length));

                    idxSpeaker = 0;
                    var basepath = 'assets/'+options.speakers[idxSpeaker]+'/';
                    soundUrl = basepath + anObject.filename + self.extension;
                    self.loadSound(soundUrl, idxSpeaker, idx);

                    idxSpeaker = 1;                    
                    var basepath2 = 'assets/'+options.speakers[idxSpeaker]+'/';
                    soundUrl2 = basepath2 + anObject.filename + self.extension;
                    self.loadSound(soundUrl2, idxSpeaker, idx);
                }

            });
        }

        this.playSound = function playSound(idx) {
            var buffer, buffer2;


            if (self.buffers[idx] != undefined ) {
                if(self.buffers[idx][0] != undefined ){
                    buffer  = self.buffers[idx][0];
                    var src = self.context.createBufferSource();
                    src.buffer = buffer;
                    src.connect(self.context.destination);
                    src.start(0);

                    src.addEventListener('ended', function(){
                        console.log('ended');
                                     if(self.buffers[idx][1] != undefined ){
                                        buffer2  = self.buffers[idx][1];
                                        var src2 = self.context.createBufferSource();
                                        src2.buffer = buffer2;
                                        src2.connect(self.context.destination);
                                        src2.start(0);
                                    }
                    }, false);

                    src.onended = function(){
                         console.log('ended 2');
                    }.bind(this);
                }

   

            }


        }

        this.init();  
    }

    // Pseudo singleton of soundscape. All calls go to this instance.
    var globalSoundscape = new Soundscape;


    var init = function() {
        $.getJSON("data/gipfel.json", function(_data) {
            data = _data;
            degreesdata = degreesDataFromData(data);
            globalSoundscape.loadSoundsForData(data);
            initDraw();
        });
    }

    $(function() {
        init();
    });

    /*==========  HELPERS  ==========*/
    function degreesDataFromData(_data) {
        // Iterates over the data array and creates an object with
        // degrees as keys. The key values are arrays with those object(s)
        // as members, which have the corresponding angle.
        var y = {};
        _data.forEach(function(anObject, idx) {
            var d = anObject.degrees.toFixed(1);
            (y[d] != undefined) ? y[d].push(anObject) : y[d] = [anObject];
            anObject['name'] = idx;
        });
        return y;
    }

    function currentDegreesFromCurrentRawDegrees(curDeg) {
        //Transforms the current rotation in a comparable format: 1.0
        var y;
        if (curDeg > 360.0) curDeg -= 360.0;
        y = 360.0 - (Math.round(curDeg * 100) / 100);
        return y.toFixed(1);
    }



    /*=========================================
    =            Main Draw Routine            =
    =========================================*/
    function draw(data) {

        /*==========  Animation Loop  ==========*/
        var activePeaks = [];

        paper.view.onFrame = function() {
            // Get current rotation of system 
            var currentDegrees = currentDegreesFromCurrentRawDegrees(peaksnraysGroup.rotation);
            peaksnraysGroup.rotation += options.rotationSpeed;

            //Find peak under beam
            if (degreesdata[currentDegrees] != undefined) {
                degreesdata[currentDegrees].forEach(function(aPeak) {
                    var idx = aPeak['name'];
                    var activePeakMarker = peaksnraysGroup.children['peak' + idx];
                    activePeakMarker.opacity = 1;
                    activePeaks.push(activePeakMarker);
                    globalSoundscape.playSound(idx);

                });
            };

            //Decay active peak markers
            activePeaks.forEach(function(anActivePeak) {
                if (anActivePeak.opacity > 0.01) anActivePeak.opacity = anActivePeak.opacity - 0.008;
                if (anActivePeak.opacity <= 0.01) activePeaks.splice(activePeaks.indexOf(anActivePeak), 1);
            });


            //
            if (options.connectTheDots) {
                connectTheDotsPath.rotate(options.rotationSpeed, paper.view.center);
            }

        }

        /*======================================*/

        console.log('(re)drawing.');

        paper.project.clear();
        // Create a Paper.js Path to draw a line into it:

        var centerPoint = paper.view.center;

        var innerPaddingVector = new paper.Point;
        innerPaddingVector.length = options.centerCircleRadius;

        //background;
        var bg = new paper.Path.Rectangle(paper.view.viewSize);
        bg.fillColor = options.backgroundColor;

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

        peaksnraysGroup.pivot = paper.view.center;

        var destVector = new paper.Point;
        for (var i = data.length - 1; i >= 0; i--) {


            destVector.angle = data[i].degrees;
            innerPaddingVector.angle = data[i].degrees;
            destVector.length = data[i].distance_km / sizes.maxDistance * sizes.maxRayLength;
            var destPoint = centerPoint.add(innerPaddingVector).add(destVector);


            if (options.displayOrbits) {
                var myCircle = new paper.Path.Circle(centerPoint, destVector.length + innerPaddingVector.length);
                myCircle.strokeColor = options.orbitStrokeColor;
                myCircle.strokeWidth = options.orbitStrokeWidth;
            }

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
                peakCircle.fillColor = options.peakFillColor;
                peakCircle.strokeWidth = options.peakStrokeWidth;
                // active peak marker
                var activePeakMarker = new paper.Path.Circle(destPoint, options.peakRadius);
                activePeakMarker.strokeColor = options.activePeakMarkerColor;
                activePeakMarker.fillColor = options.activePeakMarkerColor;
                activePeakMarker.strokeWidth = options.peakStrokeWidth;
                activePeakMarker.opacity = 0;
                activePeakMarker.name = 'peak' + i;
                //
                peaks.push(peakCircle);
                peaks.push(activePeakMarker);
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
        beam.strokeColor = options.beamColor;
        beam.strokeWidth = options.beamStrokeWidth;
        beam.moveTo(centerPoint.add(innerPaddingVector));
        beam.lineTo(beamDest);
        //


        //Rotate main layer to make o°=NORTH
        paper.project.activeLayer.rotate(-90, paper.view.center);

        //Invoke draw

        paper.view.draw();

    }


}(window.jQuery, window, document));