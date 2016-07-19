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
            //{layer: new WorldWind.CompassLayer(), enabled: true},
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

        //Display sats position
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







            $.get('./SatTracker/TLE.json', function(resp) {
                var satData = resp;
                satData.satDataString = JSON.stringify(satData);
                var satNum = 1500;

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

                for (var j = 0; j < satNum; j += 1) {
                    var pastOrbit = [];
                    var futureOrbit = [];
                    var currentPosition = null;
                    for (var i = -98; i <= 98; i++) {
                        var time = new Date(now.getTime() + i * 600000);

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

// Satellite
                var satellitesLayer = new WorldWind.RenderableLayer("Satellite");

                var highlightPlacemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);



                for (var ind = 0; ind < satNum; ind += 1) {
                    var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
                    if (satData[ind].OBJECT_TYPE === "PAYLOAD") {
                        placemarkAttributes.imageSource = "../apps/SatTracker/dot-red.png";
                        placemarkAttributes.imageScale = 0.50;
                    } else if (satData[ind].OBJECT_TYPE === "ROCKET BODY") {
                        placemarkAttributes.imageSource = "../apps/SatTracker/dot-blue.png";
                        placemarkAttributes.imageScale = 0.35;
                    } else {
                        placemarkAttributes.imageSource = "../apps/SatTracker/dot-grey.png";
                        placemarkAttributes.imageScale = 0.25;
                    }

                    placemarkAttributes.imageOffset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 0.5);
                    placemarkAttributes.imageColor = WorldWind.Color.WHITE;
                    placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 1.0);
                    placemarkAttributes.labelAttributes.color = WorldWind.Color.WHITE;

                    var placemark = new WorldWind.Placemark(everyCurrentPosition[ind]);
                    placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                    placemark.attributes = placemarkAttributes;
                    placemark.highlightAttributes = highlightPlacemarkAttributes;

                    satellitesLayer.addRenderable(placemark);
                }

                var modelLayer = new WorldWind.RenderableLayer("Model");

                wwd.addLayer(groundStationsLayer);
                wwd.addLayer(modelLayer);
                wwd.addLayer(orbitsLayer);
                wwd.addLayer(satellitesLayer);


// Draw
        wwd.redraw();

// Update Satellite Position

                window.setInterval(function() {
                    for (var indx = 0; indx < satNum; indx += 1) {
                        var position = getPosition(satellite.twoline2satrec(satData[indx].TLE_LINE1, satData[indx].TLE_LINE2), new Date());
                        everyCurrentPosition[indx].latitude = position.latitude;
                        everyCurrentPosition[indx].longitude = position.longitude;
                        everyCurrentPosition[indx].altitude = position.altitude;

                        toCurrentPosition();

                        wwd.redraw();
                    }
                }, 1000);

                var toCurrentPosition = function () {};


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
                orbitsLayer.removeAllRenderables();
                modelLayer.removeAllRenderables();
                toCurrentPosition = function () {};
            }
            highlightedItems = [];

            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.
            var rectRadius =1,
                pickPoint = wwd.canvasCoordinates(x, y),
                pickRectangle = new WorldWind.Rectangle(pickPoint[0] - rectRadius, pickPoint[1] + rectRadius,
                    2 * rectRadius, 2 * rectRadius);

            var pickList = wwd.pick(wwd.canvasCoordinates(x, y));

            // If only one thing is picked and it is the terrain, tell the world window to go to the picked location.
            if (pickList.objects.length == 1 && pickList.objects[0].isTerrain) {
                var position = pickList.objects[0].position;
                wwd.goTo(new WorldWind.Location(position.latitude, position.longitude));
                modelLayer.removeAllRenderables();
                toCurrentPosition = function () {};

            }

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
                var index = everyCurrentPosition.indexOf(position);
                var satPos = everyCurrentPosition[index];


                //Move to sat position on click and redefine navigator positioning
                //console.log(everyCurrentPosition.indexOf(position));
                    wwd.navigator.lookAtLocation.altitude = satPos.altitude;
                    wwd.goTo(new WorldWind.Position(satPos.latitude, satPos.longitude, satPos.altitude + 10000));
                  /*  window.setInterval(function () {
                        var position = getPosition(satellite.twoline2satrec(satData[index].TLE_LINE1, satData[index].TLE_LINE2), new Date());
                        satPos.latitude = position.latitude;
                        satPos.longitude = position.longitude;
                        satPos.altitude = position.altitude;
                        toCurrentPosition();
                        wwd.redraw();
                    });*/
                window.setTimeout(function() {
                toCurrentPosition = function () {
                    wwd.navigator.lookAtLocation.latitude = satPos.latitude;
                    wwd.navigator.lookAtLocation.longitude = satPos.longitude;
                    // wwd.navigator.lookAtLocation.altitude = satPos.altitude;
                    //console.log(everyCurrentPosition[index].latitude);
                };
                    toCurrentPosition();
                }, 3000);

                //hide image so collada can be displayed
                satellitesLayer.removeRenderable(placemark);
                highlightPlacemarkAttributes.imageSource = '';
                highlightPlacemarkAttributes.imageScale = 0.0;

                placemarkAttributes.imageSource = '';
                placemarkAttributes.imageScale = 0.0;

                //plot orbit on click
                var pastOrbitPath = new WorldWind.Path(everyPastOrbit[index]);
                pastOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                pastOrbitPath.attributes = pastOrbitPathAttributes;

                var futureOrbitPath = new WorldWind.Path(everyFutureOrbit[index]);
                futureOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                futureOrbitPath.attributes = futureOrbitPathAttributes;

                modelLayer.addRenderable(pastOrbitPath);
                modelLayer.addRenderable(futureOrbitPath);



                //create 3D collada model
                var colladaLoader = new WorldWind.ColladaLoader(satPos);
                colladaLoader.init({dirPath: '../apps/SatTracker/collada-models/'});
                colladaLoader.load('ISS.dae', function (scene) {
                    scene.scale = 5000;
                    modelLayer.addRenderable(scene);
                });

                //triange mesh
           /*     var altitude = 100e3,
                    numRadialPositions = 40,
                    meshPositions = [],
                    meshIndices = [],
                    outlineIndices = [],
                    texCoords = [],
                    meshRadius = 5; // degrees

                var canvas = document.createElement("canvas"),
                    ctx2d = canvas.getContext("2d"),
                    size = 64, c = size / 2 - 0.5, innerRadius = 5, outerRadius = 20;

                canvas.width = size;
                canvas.height = size;

                var gradient = ctx2d.createRadialGradient(c, c, innerRadius, c, c, outerRadius);
               // gradient.addColorStop(0, 'rgb(255, 0, 0)');
               // gradient.addColorStop(0.5, 'rgb(0, 255, 0)');
               // gradient.addColorStop(1, 'rgb(255, 0, 0)');

                ctx2d.fillStyle = gradient;
                ctx2d.arc(c, c, outerRadius, 0, 2 * Math.PI, false);
                ctx2d.fill();


                    // Create the mesh's positions, which are the center point of a circle followed by points on the circle.
                    meshPositions.push(satPos);// the mesh center
                    wwd.redraw();
                    texCoords.push(new WorldWind.Vec2(0.5, 0.5));

                    for (var angle = 0; angle < 360; angle += 360 / numRadialPositions) {
                        var angleRadians = angle * WorldWind.Angle.DEGREES_TO_RADIANS,
                            lat = meshPositions[0].latitude + Math.sin(angleRadians) * meshRadius,
                            lon = meshPositions[0].longitude + Math.cos(angleRadians) * meshRadius,
                            t = 0.5 * (1 + Math.sin(angleRadians)),
                            s = 0.5 * (1 + Math.cos(angleRadians));

                        meshPositions.push(new WorldWind.Position(lat, lon, altitude));
                        texCoords.push(new WorldWind.Vec2(s, t));
                    }

                    // Create the mesh indices.
                    for (var i = 1; i < numRadialPositions; i++) {
                        meshIndices.push(0);
                        meshIndices.push(i);
                        meshIndices.push(i + 1);
                    }

                    // Close the circle.
                    meshIndices.push(0);
                    meshIndices.push(numRadialPositions);
                    meshIndices.push(1);

                    // Create the outline indices.
                    for (var j = 1; j <= numRadialPositions; j++) {
                        outlineIndices.push(j);
                    }
                    // Close the outline.
                    outlineIndices.push(1);

                    // Create the mesh's attributes. Light this mesh.
                    var meshAttributes = new WorldWind.ShapeAttributes(null);
                    //meshAttributes = new WorldWind.ShapeAttributes(meshAttributes);
                    meshAttributes.imageSource = new WorldWind.ImageSource(canvas);
                    meshAttributes.outlineColor = WorldWind.Color.BLUE;
                    meshAttributes.interiorColor = new WorldWind.Color(1, 1, 1, 0.7);
                    //meshAttributes.imageSource = "../images/400x230-splash-nww.png";
                    meshAttributes.applyLighting = true;

                    // Create the mesh's highlight attributes.
                    var highlightAttributes = new WorldWind.ShapeAttributes(meshAttributes);
                    //highlightAttributes = new WorldWind.ShapeAttributes(highlightAttributes);
                    highlightAttributes.imageSource = new WorldWind.ImageSource(canvas);
                    highlightAttributes.outlineColor = WorldWind.Color.RED;
                    highlightAttributes.interiorColor = new WorldWind.Color(1, 1, 1, 1);
                    highlightAttributes.applyLighting = false;


                    // Create the mesh.
                    var mesh = new WorldWind.TriangleMesh(meshPositions, meshIndices, meshAttributes);
                    mesh.textureCoordinates = texCoords;
                    mesh.outlineIndices = outlineIndices;
                    mesh.highlightAttributes = highlightAttributes;

                    // Add the mesh to a layer and the layer to the World Window's layer list.
                    var meshLayer = new WorldWind.RenderableLayer();
                    meshLayer.displayName = "Triangle Mesh";
                    meshLayer.addRenderable(mesh);
                    wwd.addLayer(meshLayer); */
                    updateLLA(position);

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




                //Highlight on hover
                // Now set up to handle picking.
                var highlightedItems = [];

                var handlePick = function (recognizer) {
                    // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
                    // the mouse or tap location.
                    var x = recognizer.clientX,
                        y = recognizer.clientY;

                    var redrawRequired = highlightedItems.length > 0;

                    // De-highlight any highlighted placemarks.
                    for (var h = 0; h < highlightedItems.length; h++) {
                        highlightedItems[h].highlighted = false;
                        orbitsLayer.removeAllRenderables();
                       // modelLayer.removeAllRenderables();
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
                        var index = everyCurrentPosition.indexOf(position);
                        var satPos = everyCurrentPosition[index];

                //highlight image
                        highlightPlacemarkAttributes.imageSource = "../apps/SatTracker/satellite.png";
                        highlightPlacemarkAttributes.imageScale = 0.8;

                //plot orbit on hover
                        var pastOrbitPath = new WorldWind.Path(everyPastOrbit[index]);
                        pastOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                        pastOrbitPath.attributes = pastOrbitPathAttributes;

                        var futureOrbitPath = new WorldWind.Path(everyFutureOrbit[index]);
                        futureOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                        futureOrbitPath.attributes = futureOrbitPathAttributes;

                        var hoverPastOrbitPath = pastOrbitPath;
                        var hoverFutureOrbitPath = futureOrbitPath;

                        orbitsLayer.addRenderable(hoverPastOrbitPath);
                        orbitsLayer.addRenderable(hoverFutureOrbitPath);

                    //create label on hover
                        var placemarkLabelAttributes = new WorldWind.PlacemarkAttributes(null);
                        placemarkLabelAttributes.imageSource = "../apps/SatTracker/dot-red.png";
                        placemarkLabelAttributes.imageScale = 0.50;
                        placemarkLabelAttributes.imageOffset = new WorldWind.Offset(
                            WorldWind.OFFSET_FRACTION, 0.5,
                            WorldWind.OFFSET_FRACTION, 0.5);
                        placemarkLabelAttributes.imageColor = WorldWind.Color.WHITE;
                        placemarkLabelAttributes.labelAttributes.offset = new WorldWind.Offset(
                            WorldWind.OFFSET_FRACTION, 0.5,
                            WorldWind.OFFSET_FRACTION, 2.0);
                        placemarkLabelAttributes.labelAttributes.color = WorldWind.Color.WHITE;

                        var placemarkLabel = new WorldWind.Placemark(satPos);

                        placemarkLabel.label = satData[index].OBJECT_NAME;
                        placemarkLabel.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                        placemarkLabel.attributes = placemarkLabelAttributes;
                        orbitsLayer.addRenderable(placemarkLabel);
                    }

                    // Update the window if we changed anything.
                    if (redrawRequired) {
                        wwd.redraw();
                    }
                };

                // Listen for mouse moves and highlight the placemarks that the cursor rolls over.
                wwd.addEventListener("mousemove", handlePick);

                // Listen for taps on mobile devices and highlight the placemarks that the user taps.
                var tapRecognizer = new WorldWind.TapRecognizer(wwd, handlePick);


                // Create a layer manager for controlling layer visibility.
                var layerManger = new LayerManager(wwd);

                wwd.redraw();
            });
    });
