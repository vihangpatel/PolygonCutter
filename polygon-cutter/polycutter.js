$(function () {

    Vihang.PolyCutter = Backbone.View.extend({
        $el: $('body'),
        activeScope: null,
        inactiveScope: null,
        paperTool: null,
        pointCounts: 0,
        points: [],
        mode: 0,
        fullPolygon: null,
        polySlitter: null,
        lines: null,
        progressBar: null,

        initialize: function () {
            this.loadCanvas();
            this.attachEvents();
            this.createButtons();
            this.polySlitter = new Vihang.PolygonSplitter();
            this.polySlitter.setPaperScope(this.activeScope);
        },

        createButtons: function () {
            var self = this,
                scope = this.activeScope,
                rect = new this.activeScope.Path.Rectangle(10, 10, 100, 30);
            rect.opacity = 0.4;
            rect.fillColor = 'green';
            rect.onMouseUp = function (event) {
                setTimeout(function () {
                    self.mode = 0;
                }, 10);
                self.pointCounts = 0;
            }

            var rect2 = new this.activeScope.Path.Rectangle(130, 10, 100, 30);
            rect2.opacity = 0.4;
            rect2.fillColor = 'blue';
            rect2.onMouseUp = function (event) {
                setTimeout(function () {
                    self.mode = 1;
                }, 10);
                self.pointCounts = 0;
            }

            var pointText1 = new scope.PointText({ content: 'Drag', strokeWidth: 0.2 }),
                pointText2 = new scope.PointText({ content: 'Create', strokeWidth: 0.2 });
            pointText1.position = rect.position;
            pointText2.position = rect2.position;
            scope.view.draw();
        },

        attachEvents: function () {
            var self = this,
                paperTool = new this.activeScope.Tool()
            self.paperTool = paperTool;
            self.paperTool.onMouseDown = function (event) {
                self.downHandler(event)
            };

            self.paperTool.onMouseUp = function (event) {
                self.upHandler(event)
            };
        },

        loadCanvas: function () {
            paper.install(this);
            var activeScope = new paper.PaperScope();
            activeScope.setup(this.$el.find('#active')[0]);
            this.activeScope = activeScope;

            var inactiveScope = new paper.PaperScope();
            inactiveScope.setup(this.$el.find('#inactive')[0]);
            this.inactiveScope = inactiveScope;

            this.activeScope.activate();
            this.lines = new activeScope.Group();
            this.regions = new this.activeScope.Group();
        },

        downHandler: function (event) {
            this._drawPolygon(event);
        },

        dragHandler: function (event) {

        },

        upHandler: function (event) {
            switch (this.mode) {
                case 0:
                    this._generatePolys();
                    break;
                case 1:
                    this._drawLine(event);
                    break;
            }
        },

        _drawPolygon: function (event) {
            if (this._isNullOrUndefined(this.fullPolygon)) {
                this.fullPolygon = new this.activeScope.Path();
                this.fullPolygon.strokeColor = 'red';
            }

            this.activeScope.activate();
            if (!this.fullPolygon.closed) {
                if (this.fullPolygon.segments.length > 1 &&
                    this._arePointsNear(this.fullPolygon.segments[0].point, event.point, 10)) {
                    this.fullPolygon.closed = true;
                }
                else {
                    this.fullPolygon.add(event.point);
                }
            }
        },

        _drawLine: function (event) {
            if (this._isNullOrUndefined(this.fullPolygon) || !this.fullPolygon.closed) {
                return;
            }
            this.points[this.pointCounts] = event.point;
            this.pointCounts++;
            if (this.pointCounts % 2 === 0) {
                this._createLine();
                this.pointCounts = 0;
                this._generatePolys();
            }
        },

        _createLine: function () {
            var points = this.points,
                scope = this.activeScope,
                line = new scope.Path(points),
                handle1 = this._getCircle(5, points[0]),
                handle2 = this._getCircle(5, points[1]),
                lineGroup = new scope.Group();
            line.strokeColor = 'red';
            line.strokeWidth = 2;
            handle1.fillColor = 'green';
            handle2.fillColor = 'green';
            handle1.name = 'handle';
            handle2.name = 'handle';
            lineGroup.addChildren([line, handle1, handle2]);
            this._attachEventsOnLine(lineGroup);
            this.lines.addChild(lineGroup);
        },

        regions: null,

        _attachEventsOnLine: function (lineObject) {
            var children = lineObject.children,
                self = this,
                line = children[0],
                handle1 = children[1],
                handle2 = children[2];


            handle1.onMouseDown = function (event) {

            }
            handle1.onMouseDrag = function (event) {
                this.position = event.point;
                line.segments[0].point = event.point;
                console.log('Before : ' ,self.activeScope.project.activeLayer.children.length);
                self._generatePolys();
                self.activeScope.view.draw();
                console.log('after : ', self.activeScope.project.activeLayer.children.length);
            }

            handle2.onMouseDrag = function (event) {
                this.position = event.point;
                line.segments[1].point = event.point;
                console.log('Before : ', self.activeScope.project.activeLayer.children.length);
                self._generatePolys();
                self.activeScope.view.draw();
                console.log('after : ', self.activeScope.project.activeLayer.children.length);
            }

            line.onMouseDrag = function (event) {
                lineObject.translate(event.delta);
            }
        },

        _generatePolys: function () {
            var self = this;
            self.regions.removeChildren();
            self.regions.remove();
            self.regions = new self.activeScope.Group();
            console.log('generate poly before:', self.activeScope.project.activeLayer.children.length);
            var childrenToAdd = self.polySlitter.CreateRegions(self.lines, self.fullPolygon);            
            for (var i = 0 ; i < childrenToAdd.length ; i++) {
                var path = new self.activeScope.Path(),
                    points = childrenToAdd[i].segments;
                for (var j = 0 ; j < points.length ; j++) {
                    path.add(points[j]);
                }
                path.closed = true;
                path.onMouseDrag = function (event) {
                    this.position = event.point;
                    self.mode = 2;
                }
                self.regions.addChild(path);
            }
            console.log('generate poly after:',self.activeScope.project.activeLayer.children.length);
            self.activeScope.view.draw();
            self._redrawRegions();
        },

        _redrawRegions: function () {
            var children = this.regions.children;
            for (var i = 0 ; i < children.length ; i++) {
                children[i].fillColor = this.getRandomColor();
                children[i].opacity = 0.2;
            }
        },

        getRandomColor: function () {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        },

        extendLine: function (line) {
            var linesegments = line.segments,
                vector = this._subtract(linesegments[0].point, linesegments[1].point);
            vector.length = -1000;
        },

        _getCircle: function (radius, center) {
            var path = new this.activeScope.Path.Circle({
                center: center,
                radius: radius
            });
            return path;
        },

        _arePointsNear: function (point1, point2, tolerance) {
            var dist = point1.getDistance(point2);
            return dist <= tolerance;
        },

        _isNullOrUndefined: function (object) {
            return object === null || typeof object === 'undefined';
        },

        _subtract: function (point1, point2) {
            return new this.activeScope.Point(point1.x - point2.x, point1.y - point2.y);
        },

        _add: function (point1, point2) {
            return new this.activeScope.Point(point1.x + point2.x, point1.y + point2.y);
        }


    });

    var view = new Vihang.PolyCutter();
});