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
//Satellites
        var satellites = [
            {
                name: 'ISS',
                fileName: 'ISS.dae',
                path: '../apps/SatTracker/collada-models/',
                useImage: false,
                initialScale: 5000,
                maxScale: 1000000,
                useTexturePaths: true,
                tle_line_1: '1 25544U 98067A   16167.17503470  .00003196  00000-0  54644-4 0  9994',
                tle_line_2: '2 25544  51.6428  68.0694 0000324   5.0932 150.3291 15.54558788  4673'

            },
            {
                name: 'Hubble',
                fileName: '',
                path: '',
                useImage: true,
                initialScale: 5000,
                maxScale: 1000000,
                useTexturePaths: false,
                tle_line_1: '1 20580U 90037B   16164.81209214  .00000774  00000-0  37292-4 0  9994',
                tle_line_2: '2 20580  28.4702 287.6126 0002813 156.6394 338.1735 15.08391210234458'
            },
            {
                name: 'GPS BIIR-2  (PRN 13)',
                tle_line_1: '1 24876U 97035A   16181.56960744  .00000032  00000-0  00000+0 0  9993',
                tle_line_2: '2 24876  55.6493 241.0037 0040141 116.1169 244.3734  2.00562589138751'
            },
            {
                name: 'GPS BIIR-3  (PRN 11)',
                tle_line_1: '1 25933U 99055A   16181.55841275 -.00000053  00000-0  00000+0 0  9992',
                tle_line_2: '2 25933  51.3971  93.1166 0163280  88.0551 191.1718  2.00563312122570'
            },
            { 
                name: 'GPS BIIR-4  (PRN 20)',
                tle_line_1: '1 26360U 00025A   16181.56387050  .00000083  00000-0  00000+0 0  9995',
                tle_line_2: '2 26360  53.0788 169.5980 0043425  78.9897 303.4381  2.00552991118267'
            },
            {
                name: 'GPS BIIR-5  (PRN 28)',
                tle_line_1: '1 26407U 00040A   16181.59470870 -.00000055  00000-0  00000+0 0  9990',
                tle_line_2: '2 26407  56.6985 358.8888 0199387 267.4683  58.3939  2.00569325116941'
            },

            {
                name: 'GPS BIIR-6  (PRN 14)',
                tle_line_1: '1 26605U 00071A   16181.75399911  .00001372  00000-0  10000-3 0  9995',
                tle_line_2: '2 26605  55.2190 238.8619 0090248 248.1213 111.0024  2.00524232114548'
            },
            {
                name: 'GPS BIIR-7  (PRN 18)',
                tle_line_1: '1 26690U 01004A   16181.42572449  .00000087  00000-0  00000+0 0  9996',
                tle_line_2: '2 26690  53.0056 172.5696 0174682 252.7938 339.0017  2.00560349112932'
            },
            { 
                name: 'GORIZONT 5 [-]',
                tle_line_1: '1 13092U 82020A   16182.10038119 -.00000151  00000-0  00000+0 0  9995',
                tle_line_2: '2 13092  15.0846 337.9584 0034789 157.1687 196.9353  0.98532866 85721'
            }
    ];


// Tell World Wind to log only warnings and errors.
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

// Create the World Window.
        var wwd = new WorldWind.WorldWindow("canvasOne");
        wwd.navigator.range = 5e7;
      
        


        /**
         * Added imagery layers.
         */

        var layers = [
            {layer: new WorldWind.BMNGLayer(), enabled: true}
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



        //  var follow = false;
        window.setInterval(function () {
           
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

            var gmst = satellite.gstime_from_date(time.getUTCFullYear(),
                time.getUTCMonth() + 1,
                time.getUTCDate(),
                time.getUTCHours(),
                time.getUTCMinutes(),
                time.getUTCSeconds());

            var position_gd = satellite.eci_to_geodetic(position_eci, gmst);
            var latitude = satellite.degrees_lat(position_gd["latitude"]);
            var longitude = satellite.degrees_long(position_gd["longitude"]);
            var altitude = position_gd["height"] * 1000;

            return new WorldWind.Position(latitude, longitude, altitude);
        }

            



        for (var j = 0, len = satellites.length; j < len; j++) {
            var sats = satellites[j];
            

            var tle_line_1 = sats.tle_line_1;
            var tle_line_2 = sats.tle_line_2;

            var satrec = satellite.twoline2satrec(tle_line_1, tle_line_2);

            var now = new Date();
            var pastOrbit = [];
            var futureOrbit = [];
            var currentPosition = null;
            for (var k = -98; k <= 98; k++) {
                var time = new Date(now.getTime() + k * 60000);

                var position = getPosition(satrec, time);
                

                if (k < 0) {
                    pastOrbit.push(position);
                } else if (k > 0) {
                    futureOrbit.push(position);
                } else {
                    currentPosition = new WorldWind.Position(position.latitude,
                        position.longitude,
                        position.altitude);
                    pastOrbit.push(position);
                    futureOrbit.push(position);
                }
                
            }
            
            

// Orbit Path
            var orbitLayer = new WorldWind.RenderableLayer();
            var pathAttributes = new WorldWind.ShapeAttributes(null);
            pathAttributes.outlineColor = WorldWind.Color.RED;
            pathAttributes.interiorColor = new WorldWind.Color(1, 0, 0, 0.5);


            var pastOrbitPath = new WorldWind.Path(pastOrbit);
            pastOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            pastOrbitPath.attributes = pathAttributes;

            var pathAttributes = new WorldWind.ShapeAttributes(pathAttributes);
            pathAttributes.outlineColor = WorldWind.Color.GREEN;
            pathAttributes.interiorColor = new WorldWind.Color(0, 1, 0, 0.5);

            var futureOrbitPath = new WorldWind.Path(futureOrbit);
            futureOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            futureOrbitPath.attributes = pathAttributes;


            orbitLayer.displayName = sats.name;
            wwd.addLayer(orbitLayer);
            orbitLayer.addRenderable(pastOrbitPath);
            orbitLayer.addRenderable(futureOrbitPath);

        //satellites
            var placemark = new WorldWind.Placemark(currentPosition);
            updateLLA(currentPosition);



                var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
                placemarkAttributes.imageSource = "../apps/SatTracker/dot-red.png";
                placemarkAttributes.imageScale = 1;
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
                
                highlightPlacemarkAttributes.imageScale = 1.2;
            


            placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            placemark.label = sats.name;
            placemark.attributes = placemarkAttributes;
            placemark.highlightAttributes = highlightPlacemarkAttributes;

            var satelliteLayer = new WorldWind.RenderableLayer();
            satelliteLayer.displayName = "Satellite";
            satelliteLayer.addRenderable(placemark);
            wwd.addLayer(satelliteLayer);
            // Draw
            wwd.redraw();
            

            }
            
            
            /*   if (follow) {
             toCurrentPosition();
             }*/
            var position = getPosition(satrec, new Date());
            currentPosition.latitude = position.latitude;
            currentPosition.longitude = position.longitude;
            currentPosition.altitude = position.altitude;
            

            updateLLA(currentPosition);
            wwd.redraw();
        }, 5000);

// Satellite
        /*   //collada
         var modelLayer = new WorldWind.RenderableLayer("Model");
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
    /*    wwd.navigator.lookAtLocation = new WorldWind.Location(currentPosition.latitude, currentPosition.longitude, currentPosition.altitude);

// Draw
        wwd.redraw();

// Update Satellite Position
      //  var follow = false;
        window.setInterval(function () {
            var position = getPosition(satrec, new Date());
            currentPosition.latitude = position.latitude;
            currentPosition.longitude = position.longitude;
            currentPosition.altitude = position.altitude;

            updateLLA(currentPosition);

            if (follow) {
                toCurrentPosition();
            }

            wwd.redraw();
        }, 5000);

        function toCurrentPosition() {
            wwd.navigator.lookAtLocation.latitude = currentPosition.latitude;
            wwd.navigator.lookAtLocation.longitude = currentPosition.longitude;
            wwd.navigator.lookAtLocation.altitude = currentPosition.altitude;


        }*/
/*
// Follow Satellite
        var emptyFunction = function (e) {};
        var regularHandlePanOrDrag = wwd.navigator.handlePanOrDrag;
        var regularHandleSecondaryDrag = wwd.navigator.handleSecondaryDrag;
        var regularHandleTilt = wwd.navigator.handleTilt;
        var followPlaceholder = document.getElementById('follow');



       /* var follow = document.getElementById('follow');
        follow.onclick = toggleFollow;
        function toggleFollow() {

            follow = !follow;
            if (follow) {
                followPlaceholder.textContent = 'Follow On';
                wwd.navigator.handlePanOrDrag = emptyFunction;
                wwd.navigator.handleSecondaryDrag = emptyFunction;
                wwd.navigator.handleTilt = emptyFunction;
                wwd.navigator.lookAtLocation.range = currentPosition.altitude;


            } else {
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



        // Now set up to handle picking.

        var highlightedItems = [];

        var createOrbit = function (o) {
            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var x = o.clientX,
                y = o.clientY;

            var redrawRequired = highlightedItems.length > 0;

            // De-highlight any highlighted placemarks.
            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].highlighted = false;
            }
            highlightedItems = [];

            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.
            var rectRadius = 50,
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

            // Update the window if we changed anything.
            if (redrawRequired) {
                wwd.redraw();
            }
        };

        // Listen for mouse moves and highlight the placemarks that the cursor rolls over.
        wwd.addEventListener("mousemove", createOrbit);


    });
