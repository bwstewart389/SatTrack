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

        $.get('./SatTracker/groundstations.json', function(groundStations) {
            $.get('./SatTracker/TLE.json', function(satData) {

// Tell World Wind to log only warnings and errors.
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

// Create the World Window.
        var wwd = new WorldWind.ObjectWindow("canvasOne");
        wwd.navigator.lookAtLocation.altitude = 0;
        wwd.navigator.range = 5e7;

        
        //Add imagery layers.
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
        var typePlaceholder = document.getElementById('type');
        var intldesplaceholder = document. getElementById('intldes');

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
            placemarkAttributes.imageScale = 0.25;
            placemarkAttributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.3,
                WorldWind.OFFSET_FRACTION, 0.0);
            placemarkAttributes.imageColor = WorldWind.Color.WHITE;
            placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.5,
                WorldWind.OFFSET_FRACTION, 1.0);
            placemarkAttributes.labelAttributes.color = WorldWind.Color.WHITE;
            var groundStationsLayer = new WorldWind.RenderableLayer();

            // Create a layer to hold the surface shapes.
            //var shapesLayer = new WorldWind.RenderableLayer("Ground Station Range");

            // Create and set attributes for it. The shapes below except the surface polyline use this same attributes
            // object. Real apps typically create new attributes objects for each shape unless they know the attributes
            // can be shared among shapes.
            var attributes = new WorldWind.ShapeAttributes(null);
            attributes.outlineColor = new WorldWind.Color(0, 255, 255, 0.1);
                attributes.interiorColor = WorldWind.Color.TRANSPARENT;

           // var highlightAttributes = new WorldWind.ShapeAttributes(attributes);
           // highlightAttributes.interiorColor = new WorldWind.Color(1, 1, 1, 1);

            var boundary = [];

            var shape = new WorldWind.SurfacePolygon(boundary, attributes);
            //shape.highlightAttributes = highlightAttributes;

            for (var i = 0, len = groundStations.length; i < len; i++) {
                var groundStation = groundStations[i];

                var placemark = new WorldWind.Placemark(new WorldWind.Position(groundStation.LATITUDE,
                    groundStation.LONGITUDE,
                    1e3));

                shape = new WorldWind.SurfaceCircle(new WorldWind.Location(groundStation.LATITUDE,
                    groundStation.LONGITUDE), 150e4, attributes);
                // shape.highlightAttributes = highlightAttributes;

                placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                placemark.label = groundStation.name;
                placemark.attributes = placemarkAttributes;
                groundStationsLayer.addRenderable(placemark);
                groundStationsLayer.addRenderable(shape);
            }

            // Add the path to a layer and the layer to the World Window's layer list.
            groundStationsLayer.displayName = "Ground Stations";
            wwd.addLayer(groundStationsLayer);
            //wwd.addLayer(shapesLayer);
            groundStationsLayer.enabled = false;
            //shapesLayer.enabled = false;


                        var leoSatLayer = new WorldWind.RenderableLayer("LEO Satellite");
                        var meoSatLayer = new WorldWind.RenderableLayer("MEO Satellite");
                        var heoSatLayer = new WorldWind.RenderableLayer("HEO Satellite");
                        var leoRocketsLayer = new WorldWind.RenderableLayer("LEO Rocket Bodies");
                        var meoRocketsLayer = new WorldWind.RenderableLayer("MEO Rocket Bodies");
                        var heoRocketsLayer = new WorldWind.RenderableLayer("HEO Rocket Bodies");
                        var leoDebrisLayer = new WorldWind.RenderableLayer("LEO Debris");
                        var meoDebrisLayer = new WorldWind.RenderableLayer("MEO Debris");
                        var heoDebrisLayer = new WorldWind.RenderableLayer("HEO Debris");

                            //parse json 3 files payload, rockets, debris
                            satData.satDataString = JSON.stringify(satData);
                            var satNum = 2500;

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


                            var now = new Date();
                            var everyPastOrbit = [];
                            var everyFutureOrbit = [];
                            var everyCurrentPosition = [];
                            //var orbitTime = [];


                            for (var j = 0; j < satNum; j += 1) {
                                var pastOrbit = [];
                                var futureOrbit = [];
                                var currentPosition = null;
                                for (var i = -98; i <= 98; i++) {
                                    var time = new Date(now.getTime() + i * 60000);
                                    // orbitTime[i] = new Date(now.getTime() + i * 60000);
                                    //console.log(orbitTime[i]);
                                    try {
                                        var position = getPosition(satellite.twoline2satrec(satData[j].TLE_LINE1, satData[j].TLE_LINE2), time);
                                    } catch (err) {
                                    }
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


                            // Satellite
                            var highlightPlacemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);

                            //add colored image depending on sat type
                            for (var ind = 0; ind < satNum; ind += 1) {
                                var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
                                if (satData[ind].OBJECT_TYPE === "PAYLOAD") {
                                    placemarkAttributes.imageSource = "../apps/SatTracker/dot-red.png";
                                    placemarkAttributes.imageScale = 0.35;
                                } else if (satData[ind].OBJECT_TYPE === "ROCKET BODY") {
                                    placemarkAttributes.imageSource = "../apps/SatTracker/dot-blue.png";
                                    placemarkAttributes.imageScale = 0.30;
                                } else {
                                    placemarkAttributes.imageSource = "../apps/SatTracker/dot-grey.png";
                                    placemarkAttributes.imageScale = 0.25;
                                }

                                highlightPlacemarkAttributes.imageSource = '';
                                highlightPlacemarkAttributes.imageScale = 0.0;

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



                                if (satData[ind].OBJECT_TYPE ==="PAYLOAD"){
                                    if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) <= 1200){
                                        leoSatLayer.addRenderable(placemark);
                                    } else if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) > 1200 && (Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) <= 35790){
                                        meoSatLayer.addRenderable(placemark);
                                    } else if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) > 35790){
                                        heoSatLayer.addRenderable(placemark);
                                    }
                                } else if (satData[ind].OBJECT_TYPE ==="ROCKET BODY"){
                                    if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) <= 1200){
                                        leoRocketsLayer.addRenderable(placemark);
                                    } else if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) > 1200 && (Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) <= 35790){
                                        meoRocketsLayer.addRenderable(placemark);
                                    } else if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) > 35790){
                                        heoRocketsLayer.addRenderable(placemark);
                                    }
                                } else if (satData[ind].OBJECT_TYPE ==="DEBRIS") {
                                    if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) <= 1200){
                                        leoDebrisLayer.addRenderable(placemark);
                                    } else if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) > 1200 && (Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) <= 35790){
                                        meoDebrisLayer.addRenderable(placemark);
                                    } else if ((Math.round(everyCurrentPosition[ind].altitude  / 10) / 100) > 35790){
                                        heoDebrisLayer.addRenderable(placemark);
                                    }
                                }


                            }


                        wwd.redraw();


                //custom layers
                var modelLayer = new WorldWind.RenderableLayer("Model");
                var meshLayer = new WorldWind.RenderableLayer();
                var orbitsLayer = new WorldWind.RenderableLayer("Orbit");

                //add custom layers
                wwd.addLayer(meshLayer);
                wwd.addLayer(modelLayer);
                wwd.addLayer(orbitsLayer);

                wwd.addLayer(leoSatLayer);
                wwd.addLayer(meoSatLayer);
                wwd.addLayer(heoSatLayer);
                wwd.addLayer(leoRocketsLayer);
                wwd.addLayer(meoRocketsLayer);
                wwd.addLayer(heoRocketsLayer);
                wwd.addLayer(leoDebrisLayer);
                wwd.addLayer(leoDebrisLayer);
                wwd.addLayer(meoDebrisLayer);
                wwd.addLayer(heoDebrisLayer);

                $('.payloads').click(function()
                {
                    if ($(this).text() == "PAYLOADS on")
                    {
                        $(this).text("PAYLOADS Off");
                        leoSatLayer.enabled = false;
                        meoSatLayer.enabled = false;
                        heoSatLayer.enabled = false;
                    }
                    else
                    {
                        $(this).text("PAYLOADS On");
                        leoSatLayer.enabled = true;
                        meoSatLayer.enabled = true;
                        heoSatLayer.enabled = true;

                    }
                });

        // Draw
        wwd.redraw();

                // Update all Satellite Positions
                window.setInterval(function() {
                    for (var indx = 0; indx < satNum; indx += 1) {
                        var position = getPosition(satellite.twoline2satrec(satData[indx].TLE_LINE1, satData[indx].TLE_LINE2), new Date());
                        everyCurrentPosition[indx].latitude = position.latitude;
                        everyCurrentPosition[indx].longitude = position.longitude;
                        everyCurrentPosition[indx].altitude = position.altitude;

                        //allows for updating lookAtNavigator and visual cone when called on line 347
                        toCurrentPosition();
                        meshToCurrentPosition();

                        wwd.redraw();
                    }
                }, 1000);

                //empty toCurrentPosition function to disengage follow function
                var toCurrentPosition = function () {};
                var meshToCurrentPosition = function () {};

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
                satelliteLayer.enabled = true;
                //turns off renderables that were turned on by click
                orbitsLayer.removeAllRenderables();
                modelLayer.removeAllRenderables();
                //emptys function to turn off follow
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
                satelliteLayer.enabled = true;
                wwd.goTo(new WorldWind.Location(position.latitude, position.longitude));
                //turns off renderables that were turned on by click
                modelLayer.removeAllRenderables();
                meshLayer.removeAllRenderables();
                //empties function to turn off follow
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
                satelliteLayer.enabled = false;
                typePlaceholder.textContent = satData[index].OBJECT_TYPE;
                intldesplaceholder.textContent = satData[i].INTLDES;


                //Move to sat position on click and redefine navigator positioning
                //console.log(everyCurrentPosition.indexOf(position));
                    //Changes center point of view.
                    wwd.navigator.lookAtLocation.altitude = satPos.altitude;
                    wwd.goTo(new WorldWind.Position(satPos.latitude, satPos.longitude, satPos.altitude + 10000));
                //delays navigator position change for smooth transition
                window.setTimeout(function() {
                //change view position
                toCurrentPosition = function () {
                    wwd.navigator.lookAtLocation.latitude = satPos.latitude;
                    wwd.navigator.lookAtLocation.longitude = satPos.longitude;
                    // wwd.navigator.lookAtLocation.altitude = satPos.altitude;

                    $('.follow').click(function()
                    {
                        if ($(this).text() == "Follow On")
                        {
                            $(this).text("Follow Off");
                            toCurrentPosition = function(){};
                        }
                        else
                        {
                            $(this).text("Follow On");
                            toCurrentPosition = function () {
                                wwd.navigator.lookAtLocation.latitude = satPos.latitude;
                                wwd.navigator.lookAtLocation.longitude = satPos.longitude;
                            };
                        }
                    });

                };

                    $('.mesh').click(function()
                    {
                        if ($(this).text() == "Mesh On")
                        {
                            $(this).text("Mesh Off");
                            meshLayer.removeAllRenderables();
                            meshToCurrentPosition = function(){};
                        }
                        else
                        {
                            $(this).text("Mesh On");meshToCurrentPosition = function () {
                            meshLayer.removeAllRenderables();
                            //create triangle mesh
                            var altitude = [],
                                numRadialPositions = 40,
                                meshPositions = [],
                                meshIndices = [],
                                outlineIndices = [],
                                texCoords = [],
                                meshRadius = 15; // degrees

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
                            meshAttributes.outlineColor = new WorldWind.Color(51, 51, 255, 0.03);
                            meshAttributes.interiorColor = new WorldWind.Color(255, 255, 51, 0.030);
                            // meshAttributes.imageSource = "../images/400x230-splash-nww.png";
                            meshAttributes.applyLighting = false;


                            // Create the mesh.
                            var mesh = new WorldWind.TriangleMesh(meshPositions, meshIndices, meshAttributes);
                            mesh.textureCoordinates = texCoords;
                            mesh.outlineIndices = outlineIndices;
                            //mesh.highlightAttributes = highlightAttributes;

                            // Add the mesh to a layer and the layer to the World Window's layer list.
                            meshLayer.displayName = "Triangle Mesh";
                            meshLayer.addRenderable(mesh);
                            updateLLA(position);
                        };
                            meshToCurrentPosition();
                        }
                    });





                    updateLLA(position);
                    toCurrentPosition();
                }, 3000);

                //hide image so collada can be display

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
                        meshToCurrentPosition = function () {};
                        meshLayer.removeAllRenderables();
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
                        typePlaceholder.textContent = satData[index].OBJECT_TYPE;
                        intldesplaceholder.textContent = satData[i].INTLDES;

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
                       // placemarkLabelAttributes.imageSource = "../apps/SatTracker/dot-red.png";
                        //placemarkLabelAttributes.imageScale = 0.50;
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

                        meshToCurrentPosition = function () {
                            meshLayer.removeAllRenderables();
                            //create triangle mesh
                            var altitude = [],
                                numRadialPositions = 40,
                                meshPositions = [],
                                meshIndices = [],
                                outlineIndices = [],
                                texCoords = [],
                                meshRadius = 15; // degrees

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
                            meshAttributes.outlineColor = new WorldWind.Color(51, 51, 255, 0.03);
                            meshAttributes.interiorColor = new WorldWind.Color(255, 255, 51, 0.030);
                            // meshAttributes.imageSource = "../images/400x230-splash-nww.png";
                            meshAttributes.applyLighting = false;


                            // Create the mesh.
                            var mesh = new WorldWind.TriangleMesh(meshPositions, meshIndices, meshAttributes);
                            mesh.textureCoordinates = texCoords;
                            mesh.outlineIndices = outlineIndices;
                            //mesh.highlightAttributes = highlightAttributes;

                            // Add the mesh to a layer and the layer to the World Window's layer list.
                            meshLayer.displayName = "Triangle Mesh";
                            meshLayer.addRenderable(mesh);
                            updateLLA(position);
                        };
                        meshToCurrentPosition();
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

    });
