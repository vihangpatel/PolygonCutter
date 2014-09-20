

$(function () {

    Vihang.PolygonSplitter = Backbone.View.extend({
        scope: null,

        initialize: function () {

        },

        setPaperScope: function (scope) {
            this.scope = scope;
        },

        getPointsFromPath: function (path) {
            if (path === null || typeof path === 'undefined') {
                return [];
            }
            var segments = path.segments,
                points = [];
            for (var i = 0 ; i < segments.length ; i++) {
                points.push(segments[i].point.clone());
            }
            return { segments: points, id: path.id };
        },

        clonePaths : function(pathsList) {
            var clonedPaths = [];
            for (var i = 0; i < pathsList.length ; i++) {
                var segments = pathsList[i].segments,
                    pointsList = [];
                for (var j = 0 ; j < segments.length ; j++) {
                    pointsList.push(segments[j].clone());
                }
                clonedPaths.push({ segments: pointsList, id: pathsList[i].id });
            }
            return clonedPaths;
        },

        CreateRegions: function (lines, defaultPoly) {
            var lstRegions = [],
                self = this,
                clonedList = null,
                lineChildren = lines.children;
            lstRegions.push(this.getPointsFromPath(defaultPoly));
            for (var i = 0 ; i < lineChildren.length ; i++) {
                var line = lineChildren[i].children[0];
                var newRegions = null,
                    clonedChildren;

                clonedList = this.clonePaths(lstRegions);

                for (var j = 0; j < clonedList.length; j++) {
                    newRegions = this.splitPolygon(line, clonedList[j]);
                    if (newRegions == null)
                        continue;
                    this.deleteElement(lstRegions, clonedList[j]);
                    lstRegions = lstRegions.concat(newRegions);
                }           
            }
            return lstRegions;
        },

        deleteElement: function (from, objToDelete) {
            var children = from;
            for (var i = 0 ; i < children.length ; i++) {
                if (children[i].id === objToDelete.id) {
                    from.splice(i, 1);
                }
            }
            return from;
        },   

        splitPolygon: function (line, polygon) {
            var segments = polygon.segments,
                curves = polygon.curves,
                scope = this.scope,
                nextIndex,
                point,
                nextIndex,
                firstPoint = new scope.Point(-1000, -1000),
                secondPoint = new scope.Point(-1000, -1000),
                intersection,
                count = 0,
                breakPt1 = -1,
                breakPt2 = -1,
                intersectionList = [],
                paperPolyGon = new this.scope.Path(segments);
            paperPolyGon.closed = true;
            if (paperPolyGon.getIntersections(line).length > 2) {
                var splittedPolgons = this.intrinsicSplitter(line, paperPolyGon);
                paperPolyGon.remove();
                return splittedPolgons;
            }
            for (var i = 0 ; i < segments.length ; i++) {
                nextIndex = i == segments.length - 1 ? 0 : i + 1;
                var dummyLine = new scope.Path([segments[i], segments[nextIndex]]);
                intersection = line.getIntersections(dummyLine);
                dummyLine.remove();
                if (intersection.length == 0) {
                    continue;
                }
                point = intersection[0].point;
                if (count === 1 && !point.equals(firstPoint)) {
                    secondPoint = point.clone();
                    breakPt2 = i;
                    break;
                }
                if (count === 0) {
                    firstPoint = point.clone();
                    breakPt1 = i;
                    count++;
                }
            }

            if (breakPt1 < 0 || breakPt2 < 0 || count < 1) {
                return null;
            }

            var region1 = {},
                region1Points = [];
            for (var i = 0 ; i <= breakPt1 ; i++) {
                region1Points.push(segments[i].clone());
            }
            region1Points.push(firstPoint.clone());
            region1Points.push(secondPoint.clone());

            for (var i = breakPt2 + 1; i < segments.length; i++) {
                region1Points.push(segments[i].clone());
            }
            region1.segments = region1Points;
            region1.id = paperPolyGon.id + 1;


            var region2 = {},
                region2Points = [];
            region2Points.push(firstPoint.clone());
            for (var i = breakPt1 + 1; i <= breakPt2; i++) {
                region2Points.push(segments[i]);
            }
            region2Points.push(secondPoint.clone());
            region2.segments = region2Points;
            region2.id = paperPolyGon.id + 2;

            paperPolyGon.remove();
            if (region1.segments.length == 2 || region2.segments.length == 2) {
                region1.remove();
                region2.remove();
                return null;
            }
            return [region1, region2];
        },

        intrinsicSplitter: function (line, polygon) {
            var intersections = line.getIntersections(polygon);
            if (intersections.length < 2) {
                return null;
            }
            var pointsToSort = [];
            for (var i = 0 ; i < intersections.length ; i++) {
                pointsToSort.push(intersections[i].point);
            }
            var sortedPoints = this._sortPoints(pointsToSort),
                scope = this.scope,
                lineGroup = new scope.Group();
            for (var i = 0 ; i < parseInt(sortedPoints.length / 2) ; i++) {
                var point1 = polygon.getNearestPoint(sortedPoints[i * 2]),
                    point2 = polygon.getNearestPoint(sortedPoints[i * 2 + 1]);
					
				point1 = GetvarOnLineUsingDistance(point1,point2,-1,0,true);
				point2 = GetvarOnLineUsingDistance(point1,point2,-1,0,false);
                var dummyLine = this.dummyLine(point1, point2);
                var dummyGroup = new scope.Group();
                dummyGroup.addChild(dummyLine);
                dummyLine.strokeColor = 'green';
                lineGroup.addChild(dummyGroup);
            }
            var splittedPolygonGroup = this.CreateRegions(lineGroup, polygon);
            lineGroup.remove();
            return splittedPolygonGroup;
        },

        _sortPoints: function (points) {
            var result = [],
                arrayToSort = [],
                vector = this._subtract(points[0], points[1]);
            vector.length = -5000;
            var refPoint = this._add(points[0], vector);
            for (var i = 0; i < points.length ; i++) {
                var distance = refPoint.getDistance(points[i]);
                arrayToSort[distance] = points[i].clone();
            }
            var keys = Object.keys(arrayToSort),
                keysLength = keys.length,
                sortedArray = [];
            keys.sort(function (a, b) {
                return a - b;
            });

            for (var i = 0 ; i < keysLength ; i++) {
                sortedArray.push(arrayToSort[keys[i]]);
            }
            return sortedArray;
        },

        dummyLine: function (startPoint, endPoint) {
            return new this.scope.Path([startPoint, endPoint]);
        },

        _subtract: function (point1, point2) {
            return new this.scope.Point(point1.x - point2.x, point1.y - point2.y);
        },

        _add: function (point1, point2) {
            return new this.scope.Point(point1.x + point2.x, point1.y + point2.y);
        }

    },
    {
        EVENTS: {
            PROGRESSING: 'progressing',
            COMPLETED: 'completed',
            STARTED: 'started'
        }
    });

});