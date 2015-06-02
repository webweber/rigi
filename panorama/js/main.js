(function($, window, document) {

    var options = {
       //Animation
        rotationSpeed: 0.1,// default: 0.1

        //misc params
        speakers:['swissgerman','chinese_male'],// possible values = names of 'assets'-subfolders
        initialRotation: -90, // North = -90

        //display switches
        displayRays: true,
        displayPeaks: true,
        displayOrbits: true,
        displayAltitudeHierarchy: false,
        connectTheDots: false,

        //general
        rigiAltitude: 1798,
        outerPadding: 20,
        backgroundColor: 'rgb(23, 14, 14)',
        //Center Circle
        centerCircleStrokeColor: '#666666',
        centerCircleStrokeWidth: 0.3,
        centerCircleRadius: 25,
        //Rays
        rayStrokeColor: 'rgba(102, 102, 102, 0.2)',
        rayStrokeColorTaller: '#ff9999',
        rayStrokeColorSmaller: '#9999ff',
        rayStrokeWidth: 0.5,
        //Peaks
        peakStrokeColor: 'rgba(102, 102, 102, 0.2)',
        peakFillColor: 'rgba(102, 102, 102, 0.1)',
        peakStrokeWidth: 1,
        peakRadius: 2.3,
        activePeakMarkerColor: 'red',
        //Beam ( upwards pointing indicator )
        beamColor: 'red',
        beamStrokeWidth: 1,
        //ConnectTheDots Path
        connectTheDotsColor: '#ffcccc',
        connectTheDotsWidth: 0.3,
        connectTheDotsSmoothPath: true,
        //Orbits = the concentric circles the dots sit on
        orbitStrokeColor: 'rgba(255, 255, 255, 0.04)',
        orbitStrokeWidth: 0.1,

        //Animation
        rotationSpeed: 0.1,

        //Soundscape
        masterVolume: 0.3
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



    var initWordcloud = function() {

    };

    var addWord = function(idx) {
        var w1 = document.getElementById('w1');
        var w2 = document.getElementById('w2');

        var word = data[idx];
        var p = document.createElement("p");
        var wordE = document.createElement("p");
        var altitudeE = document.createElement("p");
        $(wordE).addClass('name');
        $(altitudeE).addClass('altitude');

        p.insertBefore(altitudeE, p.firstChild);
        p.insertBefore(wordE, altitudeE);

        wordE.innerHTML = word['peak_name'];
        altitudeE.innerHTML = word['altitude'];

        if (idx % 2 == 0) {
            w1.insertBefore(p, w1.firstChild);
        } else {
            w2.insertBefore(p, w2.firstChild);
        }

        // setTimeout(function() {
        //     $(p).remove();
        // }, 4000);
    }


    var Soundscape = function() {
        var self = this;
        this.buffers = [];

     //   this.basepath = 'assets/swissgerman/';

        this.extension = '.mp3';

        self.masterVolumeGainNode;

        this.init = function() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            self.context = new AudioContext();
            self.masterVolumeGainNode = self.context.createGain();
            self.masterVolumeGainNode.connect(self.context.destination);
            self.masterVolumeGainNode.gain.value = options.masterVolume;
            console.log("Soundscape loaded");
        };

        this.loadSound = function loadDogSound(url, idxSpeaker, idx, isLast) {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';

            req.onload = function() {
                self.context.decodeAudioData(req.response, function(buffer) {
                    self.buffers[idx] = buffer;
                    preloader("sound");
                    if( self.buffers[idx] == undefined){
                        self.buffers[idx] = new Array();
                    }
                    self.buffers[idx][idxSpeaker] = buffer;
                }, function(err) {
                    console.log('decoding error for ' + url);
                    preloader("sound");
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
            var buffer;

            if (undefined != self.buffers[idx]) {
                buffer = self.buffers[idx];
            } else return;
            var src = self.context.createBufferSource();
            src.buffer = buffer;
            src.connect(self.masterVolumeGainNode);
            src.start(0);
            var buffer, buffer2;


            if (self.buffers[idx] != undefined ) {
                if(self.buffers[idx][0] != undefined ){// 0 == speakers[0]
                    buffer  = self.buffers[idx][0];
                    var src = self.context.createBufferSource();
                    src.buffer = buffer;
                    src.connect(self.context.destination);
                    src.start(0);
/*
                    src.addEventListener('ended', function(){// does not work?
                        console.log('ended '+idx);
                    }.bind(self), false);
  */     
                    src.onended = function(){
                        if(self.buffers[idx][1] != undefined ){// 1 == speakers[1]
                            buffer2  = self.buffers[idx][1];
                            var src2 = self.context.createBufferSource();
                            src2.buffer = buffer2;
                            src2.connect(self.context.destination);
                            src2.start(0);
                        }
                    }.bind(this);
                }

            }


        }

        this.init();  
    }

    // Pseudo singleton of soundscape. All calls go to this instance.
    var globalSoundscape = new Soundscape;

    var initPreloader = function(_data) {
        console.log("preloader initialized");
        var progress;
        var length = _data.length;
        var soundsLoaded = 0;
        var firstCall = true;
        var paperloaded = false;
        window.preloader = function(type) {

            if (type == "sound") {
                soundsLoaded++;
                progress = soundsLoaded / length;
                $(".loader.hor").css('width', progress * 100 + "%");
            };

            if (type == "paper") {
                console.log("paperloaded");
                paperloaded = true;

            };

            if (progress > 0.95 && paperloaded == true && firstCall == true) {
                console.log("progress > 90%");
                firstCall = false;

                paper.view.play();
                $(".loader").removeClass('loading');
                setTimeout(function() {

                    $(".loaderModal").removeClass('loading');
                }, 2500)

            };
        }
    }

    var initDraw = function() {
        sizes.maxDistance = maxDistance(data);
        // Create an empty project and a view for the canvas:
        var canvas = document.getElementById('myCanvas');
        paper.setup(canvas);

        paper.view.onResize = resizeHandler;
        resizeHandler();
        paper.view.pause();
        console.log("Draw loaded");
        preloader("paper");

    }

    var init = function() {
        $.getJSON("data/gipfel.json", function(_data) {
            data = _data;
            initPreloader(data);
            degreesdata = degreesDataFromData(_data);
            globalSoundscape.loadSoundsForData(_data);
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
    var activePeaks = [];


    function draw(data) {


        /*==========  Animation Loop  ==========*/
        paper.view.onFrame = function(evt) {

            // Get current rotation of system 
            var currentDegrees = currentDegreesFromCurrentRawDegrees(peaksnraysGroup.rotation + 0.5);
            peaksnraysGroup.rotation += options.rotationSpeed;

            activePeakMarkersGroup.rotation += options.rotationSpeed;


            //Find peak under beam
            if (degreesdata[currentDegrees] != undefined) {
                degreesdata[currentDegrees].forEach(function(aPeak) {
                    var idx = aPeak['name'];
                    var activePeakMarker = activePeakMarkersGroup.children['peak' + idx];
                    activePeakMarker.opacity = 0.5;

                    setTimeout(function() {
                        activePeakMarker.opacity = 0.95;
                    }, 200);

                    setTimeout(function() {
                        activePeakMarker.opacity = 0.6;
                    }, 500);

                    setTimeout(function() {
                        activePeakMarker.opacity = 0.3;
                    }, 600);

                    setTimeout(function() {
                        activePeakMarker.opacity = 0.15;
                    }, 700);

                    setTimeout(function() {
                        activePeakMarker.opacity = 0.0;
                    }, 800);

                    globalSoundscape.playSound(idx);
                    addWord(idx);

                });
            };






            //
            if (options.connectTheDots) {
                connectTheDotsPath.rotate(options.rotationSpeed, paper.view.center);
            }

        }


        /*======================================*/
        var rasterImg;
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
        var activePeakMarkers = [];
        var activePeakMarkersGroup = new paper.Group;

        var peaksnrays = [];
        var peaksnraysGroup = new paper.Group;


        peaksnraysGroup.pivot = paper.view.center;
        activePeakMarkersGroup.pivot = paper.view.center;



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
                //Experimental: Peak size proportional to alitude
                var propPeakRadius = options.peakRadius * data[i].altitude / 1750;
                //
                var peakCircle = new paper.Path.Circle(destPoint, propPeakRadius);
                peakCircle.strokeColor = options.peakStrokeColor;
                peakCircle.fillColor = options.peakFillColor;
                peakCircle.strokeWidth = options.peakStrokeWidth;
                peakCircle.data.dest = destVector;
                // active peak marker
                var activePeakMarker = new paper.Path.Circle(destPoint, propPeakRadius);
                activePeakMarker.strokeColor = options.activePeakMarkerColor;
                activePeakMarker.fillColor = options.activePeakMarkerColor;
                activePeakMarker.strokeWidth = options.peakStrokeWidth;
                activePeakMarker.opacity = 0;
                activePeakMarker.name = 'peak' + i;
                //


                activePeakMarkers.push(activePeakMarker);
                activePeakMarkersGroup.addChildren(activePeakMarkers);

                peaks.push(peakCircle);
                peaksnraysGroup.addChildren(peaks);
                activePeakMarkersGroup.bringToFront();
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
        paper.project.activeLayer.rotate(options.initialRotation, paper.view.center);

        //Invoke draw
        paper.view.draw();



    };


})(window.jQuery, window, document);