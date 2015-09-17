/**
 * Created by mikeh on 5/2/14.
 */

//
// TODO: make this a module
//

define(['HexCell'], function (HexCell) {

  // the module
  "use strict";

  var degrees = function(radians) {return radians / Math.PI * 180;};

  var NeighborType = {
    Neighbor_SELF : -1,
    Neighbor_START : 0,

    Neighbor_SE : 0,
    Neighbor_NE : 1,
    Neighbor_N  : 2,
    Neighbor_NW : 3,
    Neighbor_SW : 4,
    Neighbor_S  : 5,

    Neighbor_COUNT: 6
  };

  function buildNeighbor(hexCell, type, offset)
  {
    var gx = hexCell.gridX;
    var gy = hexCell.gridY;

    switch(type)
    {
      case NeighborType.Neighbor_SE:
        gx += offset;
        gy += offset;
        break;
      case NeighborType.Neighbor_SW:
        gx -= offset;
        gy += offset;
        break;
      case NeighborType.Neighbor_NE:
        gx += offset;
        gy -= offset;
        break;
      case NeighborType.Neighbor_NW:
        gx -= offset;
        gy -= offset;
        break;
      case NeighborType.Neighbor_N:
        gy -= offset*2;
        break;
      case NeighborType.Neighbor_S:
        gy += offset*2;
        break;
      case NeighborType.Neighbor_SELF:
        break;
    }
    return new HexCell(gx,gy);
  }


  function buildHexRun(startHexCell, length)
  {
    var run = [];
    if (length === 0) {
      run.push(startHexCell);
      return run;
    }
    var dirSet = [NeighborType.Neighbor_SE,
      NeighborType.Neighbor_NE,
      NeighborType.Neighbor_N,
      NeighborType.Neighbor_NW,
      NeighborType.Neighbor_SW,
      NeighborType.Neighbor_S];
    for (var i = 0; i < 6; i++) {
      var last;
      for (var j = 0; j < length; j++) {
        last = buildNeighbor(startHexCell, dirSet[i], j);
        run.push(last);
      }
      // update the start
      if (i + 1 < 6) {
        startHexCell = buildNeighbor(last, dirSet[i+1], 1);
      }
    }
    return run;
  }

  function maxNumberOfHexLevels(count)
  {
    if (count <= 0) {
      return 0;
    }
    var level = 1;
    var hexagonsThisLevel = 1.0;
    while(count > hexagonsThisLevel) {
      count -= hexagonsThisLevel;
      hexagonsThisLevel = level * 6.0;
      level += 1;
    }
    return level;

    /*
     * calc. max number of hexagons for a given depth
     *  depth 1 --> 1
     *  2  [2,7]    6*1 + 1
     *  3  [8,19]   6*1 + 6*2 + 1
     *  4  [20,37]  6*1 + 6*2 + 6*3  + 1
     var d = depth - 1;
     var max = 1;
     while(d>0) {
     max = max + 6*d;
     d = d - 1;
     }
     console.log("depth max ", depth, max);
     */
  }

  //
  // constructor
  //
  function HexBuilder(numberOfCells) {

    var count = numberOfCells;

    var start = new HexCell(0,0);

    // hexMeshGeometry
    var depth  = maxNumberOfHexLevels(numberOfCells);
    var width  = depth*start.width + (depth-1)*start.sideWidth*2.0/3.0;
    var height = (depth*2.0 - 1)*start.height;

    // console.log(count + " cells maps to depth ", depth);

    var hexGeometry = {
      depth:depth,
      count:count,
      width:width,
      height:height,
      cellWidth:start.width,
      cellHeight:start.height
    };


    // build the mesh
    this.cells = [];
    var cellId = 0;

    for (var i = 0; i < hexGeometry.depth; i++) {
      var run = buildHexRun(start, i);

      for (var j = 0; j < run.length; j++) {
        if (this.cells.length < hexGeometry.count) {
          var cell = run[j];
          cell.depth      = i;
          cell.birthOrder = cellId++;
          this.cells.push(cell);
        }
      }

      //  won't work, access outer scoped variable
      //
      /*
       run.forEach( (function(cell) {
       var length = this.cells.length;
       if (length < count) {
       cell.depth = i;
       cell.birthOrder = cellId++;
       this.cells.push(cell);
       }
       }))(this);
       */

      var end = run[run.length-1];
      start = buildNeighbor(end, NeighborType.Neighbor_S, 1);
    }

    this._hexGeo = hexGeometry;
  }


  var _getGeometry = function() {
    return this._hexGeo;
  };

  var _getDepth = function () {
    return this._hexGeo.depth;
  };

  var _buildOutline = function () {

    var buildKey = function(cell) {
      return cell.gridX + ',' + cell.gridY;
    };

    var dict = {};
    this.cells.forEach(function(element, index, array) {
      var key = buildKey(element);
      dict[key] = element;
    });

    var dirSet = [NeighborType.Neighbor_NE,
      NeighborType.Neighbor_N,
      NeighborType.Neighbor_NW,
      NeighborType.Neighbor_SW,
      NeighborType.Neighbor_S,
      NeighborType.Neighbor_SE];

    var outline = [];
    for(var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      for (var j = 0; j < 6; j++) {
        var tmp = buildNeighbor(cell, dirSet[j], 1);
        var key = buildKey(tmp);
        if (dict[key] === undefined) {
          // neighbor not there, must be an edge
          var idx1 = (j + 0)%6;
          var idx2 = (j + 1)%6;
          var start = cell.pathInfo[idx1];
          var end   = cell.pathInfo[idx2];

          /*
           var sx = (start.x + cell.cx).toFixed(2)*1.0;
           var sy = (start.y + cell.cy).toFixed(2)*1.0;
           var ex = (end.x + cell.cx).toFixed(2)*1.0;
           var ey = (end.y + cell.cy).toFixed(2)*1.0;
           */

          var sx = (start.x + cell.cx);
          var sy = (start.y + cell.cy);
          var ex = (end.x + cell.cx);
          var ey = (end.y + cell.cy);

          outline.push({x1:sx, y1:sy,
            x2:ex, y2:ey});
        }
      }
    }

    //
    // put the outline in clockwise order
    //
    var startPt  = outline[0];
    var segments = [{x:startPt.x1, y:startPt.y1}];
    var endPt    = {x:startPt.x2, y:startPt.y2};

    var pointMatch = function(a,b) {return Math.abs(a-b) < 0.001;};

    var findMatchingPoint = function(set, pt, isEqual) {
      // get the other end point for the matching line
      // remove the line
      for (var i = 0; i < set.length; i++) {
        if (isEqual(set[i].x1, pt.x) && isEqual(set[i].y1, pt.y)) {
          var other = {x:set[i].x2, y:set[i].y2};
          var rm = set.splice(i,1);
          return other;
        }
        if (isEqual(set[i].x2, pt.x) && isEqual(set[i].y2, pt.y)) {
          var other = {x:set[i].x1, y:set[i].y1};
          var rm = set.splice(i,1);
          return other;
        }
      }
      /*
       set.forEach(function(e, index, array) {
       console.log(e.x1.toFixed(2), e.y1.toFixed(2),
       e.x2.toFixed(2), e.y2.toFixed(2));
       });
       */
      return undefined;
    };

    while(outline.length > 0) {

      var match = findMatchingPoint(outline, endPt, pointMatch);

      if (match === undefined) {
        break;
      }

      segments.push(match);
      endPt = match;
    }// end of while loop

    return segments;
  };


  // Now add methods
  HexBuilder.prototype = {
    constructor: HexBuilder,

    getDepth:      _getDepth,
    getGeometry:   _getGeometry,
    buildOutline:  _buildOutline

  };

  return HexBuilder;
});
