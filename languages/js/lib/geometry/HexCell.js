define([], function () {

  // the module
  "use strict";

  var HexCellModule = (function() {

    // 
    var radius = 1.0;
    var angle  = 360.0/6.0;
    var rad = angle * Math.PI/180.0;
    var pathInfo = [];
    for (var i = 0; i < 6; i++) {
      var xp = Math.cos(i * rad) * radius;
      var yp = Math.sin(i * rad) * radius;

      // flip the y axis, to match SVG
      pathInfo[i] = {x:xp, y:-1.0*yp};
    }
    // pathInfo[6] = pathInfo[0]; // force a close

    var SIDE_WIDTH  = (radius*3.0)/2.0;
    var CELL_WIDTH  = radius*2.0;
    var CELL_HEIGHT = radius*Math.sqrt(3.0);


    var HexCellConstructor = function(gx, gy) {

      this.gridX = gx;
      this.gridY = gy;

      this.cx = gx     * SIDE_WIDTH;
      this.cy = gy/2.0 * CELL_HEIGHT;


      /* if not want to use transform property
       var localPoints = [];

       for (var i = 0; i < 6; i++) {
       localPoints[i] = {x:pathInfo[i].x + this.cx,
       y:pathInfo[i].y + this.cy};
       }
       this.transform = function() {return '';};
       this.pathInfo = localPoints;
       */


      // VERSION WORKS
      this.pathInfo  = pathInfo;  // shared among all instances

      this.userData  = undefined;
      this.width     = CELL_WIDTH;
      this.height    = CELL_HEIGHT;
      this.sideWidth = SIDE_WIDTH;
      this.transform = "translate(" + this.cx + "," + this.cy + ")";

      //console.log(this.width, this.height, this.sideWidth);
    }

    // Now add methods
    HexCellConstructor.prototype = {
      constructor: HexCellConstructor
    };

    // return the constructor
    return HexCellConstructor;

  })(); // returns the constructor

  
  return HexCellModule;

});