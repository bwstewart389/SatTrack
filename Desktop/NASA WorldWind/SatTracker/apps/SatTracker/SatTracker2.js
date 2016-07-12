/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @version $Id: BasicExample.js 3320 2015-07-15 20:53:05Z dcollins $
 */

require(['../../src/WorldWind',
        'http://worldwindserver.net/webworldwind/examples/LayerManager.js',
        './util/Satellite', './util/ObjectWindow', '../util/ProjectionMenu'],
    function (ww,
              LayerManager, Satellite, ObjectWindow, ProjectionMenu) {
        "use strict";

        var groundStations = [
            {name: 'Matera, Italy', latitude: 40.65, longitude: 16.7},
            {name: 'Svalbard, Norway', latitude: 78.2306, longitude: 15.3894},
            {name: 'Maspalomas, Spain', latitude: 27.7629, longitude: -15.6338},
        ];

// Tell World Wind to log only warnings and errors.
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

// Create the World Window.
        var wwd = new WorldWind.ObjectWindow("canvasOne");
        wwd.navigator.lookAtLocation.altitude = 0;
        wwd.navigator.range = 5e7;
        


        /**
         * Added imagery layers.
         */

        var layers = [
            {layer: new WorldWind.BMNGLayer(), enabled: true},
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
        ];


        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }


        //Latitude, Longitude, and Altitude
        var latitudePlaceholder = document.getElementById('latitude');
        var longitudePlaceholder = document.getElementById('longitude');
        var altitudePlaceholder = document.getElementById('altitude');

        function deg2text(deg, letters) {
            var letter;
            if (deg < 0) {
                letter = letters[1]
            } else {
                letter = letters[0]
            }

            var position = Math.abs(deg);

            var degrees = Math.floor(position);

            position -= degrees;
            position *= 60;

            var minutes = Math.floor(position);

            position -= minutes;
            position *= 60;

            var seconds = Math.floor(position * 100) / 100;

            return degrees + "° " + minutes + "' " + seconds + "\" " + letter;
        }

        function updateLLA(position) {
            latitudePlaceholder.textContent = deg2text(position.latitude, 'NS');
            longitudePlaceholder.textContent = deg2text(position.longitude, 'EW');
            altitudePlaceholder.textContent = (Math.round(position.altitude / 10) / 100) + "km";
        }

// Ground Stations Layer

        var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
       placemarkAttributes.imageSource = "../apps/SatTracker/ground-station.png";
        placemarkAttributes.imageScale = 0.5;
        placemarkAttributes.imageOffset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.3,
            WorldWind.OFFSET_FRACTION, 0.0);
        placemarkAttributes.imageColor = WorldWind.Color.WHITE;
        placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.5,
            WorldWind.OFFSET_FRACTION, 1.0);
        placemarkAttributes.labelAttributes.color = WorldWind.Color.WHITE;

        var groundStationsLayer = new WorldWind.RenderableLayer();
        for (var i = 0, len = groundStations.length; i < len; i++) {
            var groundStation = groundStations[i];

            var placemark = new WorldWind.Placemark(new WorldWind.Position(groundStation.latitude,
                groundStation.longitude,
                1e3));

            placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            placemark.label = groundStation.name;
            placemark.attributes = placemarkAttributes;
            groundStationsLayer.addRenderable(placemark);
        }
            // Add the path to a layer and the layer to the World Window's layer list.
            groundStationsLayer.displayName = "Ground Stations";

            wwd.addLayer(groundStationsLayer);





            $.get('./SatTracker/TLE.json', function(resp) {
                var satData = resp;
                satData.satDataString = JSON.stringify(satData);


// Orbit Propagation (MIT License, see https://github.com/shashwatak/satellite-js)

                function getPosition(satrec, time) {
                    var position_and_velocity = satellite.propagate(satrec,
                        time.getUTCFullYear(),
                        time.getUTCMonth() + 1,
                        time.getUTCDate(),
                        time.getUTCHours(),
                        time.getUTCMinutes(),
                        time.getUTCSeconds());
                    var position_eci = position_and_velocity["position"];

                    var gmst = satellite.gstime_from_date (time.getUTCFullYear(),
                        time.getUTCMonth() + 1,
                        time.getUTCDate(),
                        time.getUTCHours(),
                        time.getUTCMinutes(),
                        time.getUTCSeconds());

                    var position_gd = satellite.eci_to_geodetic (position_eci, gmst);
                    var latitude    = satellite.degrees_lat(position_gd["latitude"]);
                    var longitude   = satellite.degrees_long(position_gd["longitude"]);
                    var altitude    = position_gd["height"] * 1000;

                    return new WorldWind.Position(latitude, longitude, altitude);
                }


                var now = new Date();
                var everyPastOrbit = [];
                var everyFutureOrbit = [];
                var everyCurrentPosition = [];

                for (var j = 0; j < 10; j += 1) {
                    var pastOrbit = [];
                    var futureOrbit = [];
                    var currentPosition = null;
                    for (var i = -98; i <= 98; i++) {
                        var time = new Date(now.getTime() + i * 60000);

                        var position = getPosition(satellite.twoline2satrec(satData[j].TLE_LINE1, satData[j].TLE_LINE2), time);

                        if (i < 0) {
                            pastOrbit.push(position);
                        } else if (i > 0) {
                            futureOrbit.push(position);
                        } else {
                            currentPosition = new WorldWind.Position(position.latitude,
                                position.longitude,
                                position.altitude);
                            pastOrbit.push(position);
                            futureOrbit.push(position);
                            everyCurrentPosition[j] = currentPosition;
                        }
                    }
                    everyPastOrbit[j] = pastOrbit;
                    everyFutureOrbit[j] = futureOrbit;
                }


// Orbit Path
                var pastOrbitPathAttributes = new WorldWind.ShapeAttributes(null);
                pastOrbitPathAttributes.outlineColor = WorldWind.Color.RED;
                pastOrbitPathAttributes.interiorColor = new WorldWind.Color(1, 0, 0, 0.5);

                var futureOrbitPathAttributes = new WorldWind.ShapeAttributes(null);//pastAttributes
                futureOrbitPathAttributes.outlineColor = WorldWind.Color.GREEN;
                futureOrbitPathAttributes.interiorColor = new WorldWind.Color(0, 1, 0, 0.5);

                var orbitsLayer = new WorldWind.RenderableLayer("Orbit");

//var everyPastOrbitPath = [];
//var everyFutureOrbitPath = [];

                for (var index = 0; index < 10; index += 1) {
                    var pastOrbitPath = new WorldWind.Path(everyPastOrbit[index]);
                    pastOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                    pastOrbitPath.attributes = pastOrbitPathAttributes;

                    var futureOrbitPath = new WorldWind.Path(everyFutureOrbit[index]);
                    futureOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                    futureOrbitPath.attributes = futureOrbitPathAttributes;

                    orbitsLayer.addRenderable(pastOrbitPath);
                    orbitsLayer.addRenderable(futureOrbitPath);

                    //everyPastOrbitPath[index] = pastOrbitPath;
                    //everyFutureOrbitPath[index] = futureOrbitPath;
                }





// Satellite
                var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
                placemarkAttributes.imageSource = "../apps/SatTracker/dot-red.png";
                placemarkAttributes.imageScale = 0.50;
                placemarkAttributes.imageOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 0.5,
                    WorldWind.OFFSET_FRACTION, 0.5);
                placemarkAttributes.imageColor = WorldWind.Color.WHITE;
                placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 0.5,
                    WorldWind.OFFSET_FRACTION, 1.0);
                placemarkAttributes.labelAttributes.color = WorldWind.Color.WHITE;


                var highlightPlacemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
                highlightPlacemarkAttributes.imageSource = "../apps/SatTracker/satellite.png";
                highlightPlacemarkAttributes.imageScale = 0.8;

                var satellitesLayer = new WorldWind.RenderableLayer("Satellite");


                for (var ind = 0; ind < 10; ind += 1) {
                    var placemark = new WorldWind.Placemark(everyCurrentPosition[ind]);
//updateLLA(currentPosition);


//placemark.label = "Sentinel 1A";
                    placemark.label = satData[ind].OBJECT_NAME;

                    placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                    placemark.attributes = placemarkAttributes;
                    placemark.highlightAttributes = highlightPlacemarkAttributes;

                    satellitesLayer.addRenderable(placemark);
                }
                //wwd.addLayer(orbitsLayer);
                wwd.addLayer(satellitesLayer);




// Satellite Collada

        /* var modelLayer = new WorldWind.RenderableLayer("Model");
         wwd.addLayer(modelLayer);

         var position = new WorldWind.Position(currentPosition.latitude, currentPosition.longitude, currentPosition.altitude);
         updateLLA(currentPosition.latitude, currentPosition.longitude, currentPosition.altitude);
         var colladaLoader = new WorldWind.ColladaLoader(currentPosition);
         colladaLoader.init({dirPath: '../apps/SatTracker/collada-models/'});
         colladaLoader.load('ISS.dae', function (scene) {
         scene.scale = 5000;
         modelLayer.addRenderable(scene);

         });
         //end collada*/
        
// Navigation
    //    wwd.navigator.lookAtLocation = new WorldWind.Location(currentPosition.latitude, currentPosition.longitude, currentPosition.altitude);

// Draw
        wwd.redraw();

// Update Satellite Position
                var follow = false;
                window.setInterval(function() {
                    for (var indx = 0; indx < 10; indx += 1) {
                        var position = getPosition(satellite.twoline2satrec(satData[indx].TLE_LINE1, satData[indx].TLE_LINE2), new Date());
                        everyCurrentPosition[indx].latitude = position.latitude;
                        everyCurrentPosition[indx].longitude = position.longitude;
                        everyCurrentPosition[indx].altitude = position.altitude;

                        //updateLLA(currentPosition);



                        if (follow) {
                            toCurrentPosition();
                        }

                        wwd.redraw();
                    }
                }, 1000);


// Follow Satellite
      /*  var emptyFunction = function (e) {};
        var regularHandlePanOrDrag = wwd.navigator.handlePanOrDrag;
        var regularHandleSecondaryDrag = wwd.navigator.handleSecondaryDrag;
        var regularHandleTilt = wwd.navigator.handleTilt;
        var followPlaceholder = document.getElementById('follow');



        var follow = document.getElementById('follow');
        follow.onclick = toggleFollow;
        function toggleFollow() {

            follow = !follow;
            if (!follow) {

                followPlaceholder.textContent = 'Follow Off';
                wwd.navigator.handlePanOrDrag = regularHandlePanOrDrag;
                wwd.navigator.handleSecondaryDrag = regularHandleSecondaryDrag;
                wwd.navigator.handleTilt = regularHandleTilt;
                wwd.navigator.lookAtLocation.range = currentPosition.altitude;
                wwd.navigator.range = 10e6;
            }

            wwd.redraw();
            return false;
        }*/



        // Create a layer manager for controlling layer visibility.
        var layerManger = new LayerManager(wwd);


        //Highlighting
        // Now set up to handle picking.

        var highlightedItems = [];

        var handleClick = function (recognizer) {
            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var x = recognizer.clientX,
                y = recognizer.clientY;

            var redrawRequired = highlightedItems.length > 0;

            // De-highlight any highlighted placemarks.
            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].highlighted = false;
            }
            highlightedItems = [];

            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.
            var rectRadius =1,
                pickPoint = wwd.canvasCoordinates(x, y),
                pickRectangle = new WorldWind.Rectangle(pickPoint[0] - rectRadius, pickPoint[1] + rectRadius,
                    2 * rectRadius, 2 * rectRadius);

            var pickList = wwd.pickShapesInRegion(pickRectangle);
            if (pickList.objects.length > 0) {
                redrawRequired = true;
            }

            
            
            // Highlight the items picked.
            if (pickList.objects.length > 0) {
                for (var p = 0; p < pickList.objects.length; p++) {
                    if (pickList.objects[p].isOnTop) {
                        pickList.objects[p].userObject.highlighted = true;
                        highlightedItems.push(pickList.objects[p].userObject);
                    }
                    
                }
            }

            if (pickList.objects.length == 1 && pickList.objects[0]) {
                var position = pickList.objects[0].position;
                wwd.goTo(new WorldWind.Position(position.latitude, position.longitude, position.altitude + 100000));
               /* window.setInterval(function() {
                    
                wwd.navigator.lookAtLocation.altitude = everyCurrentPosition[everyCurrentPosition.indexOf(position)].altitude;
                wwd.navigator.lookAtLocation.latitude = everyCurrentPosition[everyCurrentPosition.indexOf(position)].latitude;
                wwd.navigator.lookAtLocation.longitude = everyCurrentPosition[everyCurrentPosition.indexOf(position)].longitude;

                    wwd.redraw();
                    updateLLA(position);
                }, 1000);*/
                console.log(everyCurrentPosition.indexOf(position));

            }



            // Update the window if we changed anything.
            if (redrawRequired) {
                wwd.redraw();
            }
        };


        // Listen for mouse clicks.
        var clickRecognizer = new WorldWind.ClickRecognizer(wwd, handleClick);

        // Listen for taps on mobile devices.
        var tapRecognizer = new WorldWind.TapRecognizer(wwd, handleClick);

            });
    });
