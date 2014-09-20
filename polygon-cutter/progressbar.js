

$(function () {

    Vihang.ProgressBar = Backbone.View.extend({

        container : null,
        proWidth: 280,
        proHeight: 30,
        height: 200,
        width: 300,
        bar: null,
        box: null,
        scope: null,

        initialize: function () {

        },

        setPaperScope: function (scope) {
            this.scope = scope;
            this.container = new scope.Group();
            this.createBox();
        },

        createBox: function () {
            this.scope.activate();
            var scope = this.scope,
                center = scope.view.center,
                rect = new scope.Path.Rectangle(0, 0, this.width, this.height);

            rect.fillColor = 'white';
            rect.shadowColor = 'black';
            rect.position = center;
            this.box = rect;

            var bar = new scope.Path.Rectangle(0, 0, 1, this.proHeight);
            bar.fillColor = 'green';
            bar.opacity = 0.75;
            this.bar = bar;
            this.container.addChildren([rect, bar]);
        },

        progressStarted: function () {

            this.scope.activate();
            this.container.opacity = 1;
            this.bar.bounds.x = this.box.bounds.x + (this.width - this.proWidth) / 2;
            this.bar.bounds.y = this.box.position.y;
            this.scope.view.draw();

        },

        setProgress: function (current, total) {

            this.scope.activate();
            var mulfactor = (current + 1) / total,
                newWidth = this.proWidth * mulfactor;
            this.bar.bounds.width = newWidth;
            this.bar.bounds.x = this.box.bounds.x + (this.width - this.proWidth) / 2;
            this.bar.bounds.y = this.box.position.y;
            this.scope.view.draw();           
            console.log(mulfactor * 100 + '% completed');
        },

        progressEnded: function () {
            this.container.opacity = 0;
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