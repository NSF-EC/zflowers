/**
 * Created by mikeh on 5/7/14.
 */
define(['d3'], function (d3) {

  // the module
  "use strict";

  var module = (function () {


    // constructor
    var d3Tool = function () {
    };


    function makeFunctor() {
      return function(i) {
        return i;
      };
    }

    var _getCount = function(cells, find, accessor, low, high) {


      if (typeof(accessor) === 'undefined' || !accessor) {
        accessor = makeFunctor();
      }
      var val = accessor(find);

      if (typeof(low) === 'undefined') {
        low = val;
      }
      if (typeof(high) === 'undefined') {
        high = val + 0.001;
      }
      if (val < low || val >= high) {
        // bounds are invalid
        // e.g. looking for a 7, but the
        // acceptable range is [0,3]
        console.log("warning, bad getCount() parameters")
        return 0;
      }
      var total = 0;
      cells.forEach(function(d) {
        var v = accessor(d);
        if (v >= low && v < high ) {
          total += 1;
        }
      });
      return total;

      // equivalent using reduce
      return cells.reduce(function(total, d) {

        var v = accessor(d);

        if (v >= low && v < high ) {
          total += 1;
        }
        return total;

      }, 0);

    };


    //
    // private functions
    //
    var _getScreenBox = function(target, point) {
      var targetel   = target || d3.event.target,
        bbox       = {},
        matrix     = targetel.getScreenCTM(),
        tbbox      = targetel.getBBox(),
        width      = tbbox.width,
        height     = tbbox.height,
        x          = tbbox.x,
        y          = tbbox.y;



      point.x = x
      point.y = y
      bbox.nw = point.matrixTransform(matrix)
      point.x += width
      bbox.ne = point.matrixTransform(matrix)
      point.y += height
      bbox.se = point.matrixTransform(matrix)
      point.x -= width
      bbox.sw = point.matrixTransform(matrix)
      point.y -= height / 2
      bbox.w  = point.matrixTransform(matrix)
      point.x += width
      bbox.e = point.matrixTransform(matrix)
      point.x -= width / 2
      point.y -= height / 2
      bbox.n = point.matrixTransform(matrix)
      point.y += height
      bbox.s = point.matrixTransform(matrix)

      bbox.bb = {width: bbox.ne.x - bbox.nw.x};

      return bbox
    }


    //
    // public methods
    //

    var getColor = function(value) {
      return this.cs(value);
    };

    var getScale = function() {
      return this.cs;
    };



    //
    // exposed public API
    //
    d3Tool.prototype = {
      constructor:    d3Tool,

      getCount:       _getCount
    };



    // return the constructor
    return d3Tool;


  })();


  // return the module
  return module;
});