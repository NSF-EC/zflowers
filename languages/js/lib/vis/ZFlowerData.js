/**
 * Created by mikeh on 5/2/14.
 */

//
// uses d3.mean function
//
define(['d3'], function (d3) {

  /* holder of zFlower data */
  "use strict";

  var module = (function() {

    // var dataExample = {data:[1,0,1], max: 1.0};

    var ZFConstructor = function(data) {
      this.setData(data);
    };

    var _getLength = function() {
      return this.cells.length;
    };

    var _setData = function(value) {

      if (typeof value === 'undefined') {
        this.cells = [];
        return;
      }

      // this.orgValue = value;

      var max   = parseFloat(value.max) || 1.0;
      var cells = value.data.map(function (v, i) {
        var id = i;
        try {
          id = value.ids[i];
        }
        catch (e1) {
        }

        // normalize the v to [0,1], -1
        // assumes domain is [0, +n], -1
        try {
          var n = parseFloat(v) / max;
          if (n > 1.0) {n = +1.0; }
          if (n < 0)   {n = -1.0; }
        }
        catch (e2) {
          n = -1.0;
        }
        return {id: id, value: v, normal: n, distance: 'n/a'};

      });

      var valid = cells.filter(function(d) {
        return d.normal >= 0.0;
      });

      // calculate std of the valid numbers
      // noting each cell's distance from the mean
      var ave = d3.mean(valid, function(d) {return d.normal;});
      var s = 0;
      valid.map(function(cell, i) {
        var v = cell.normal - ave;
        s += v * v;
        cell.distance = v;
      });
      // note the above algorithm is essentially the same as
      // numbers.standardDeviation (which is used for restAPI stats calculations)

      this.std = Math.sqrt(s/valid.length);
      //this.std = Math.sqrt(d3.variance(valid,function(d) {return d.normal;}));
      this.ave = ave;
      this.n   = valid.length;

      var inorder = cells.sort(function (a, b) {

        if (a.normal === b.normal) {
          // force a stable sort
          // by using the id as secondary
          return a.id - b.id;
        }

        // put the -1 values at the end
        if (a.normal < 0) {
          return +1;
        }
        if (b.normal < 0) {
          return -1;
        }
        return Math.abs(a.distance) - Math.abs(b.distance);
      });
      //console.log("sorted ", inorder);

      // add the cell that represents the ave.
      if (inorder.length === 0) {
        // not really an ave, but put in a holding cell
        inorder.unshift({id: -1, value: -1, normal: -1, distance: 0});
      }
      else {
        inorder.unshift({id: -1, value: (ave * max), normal: ave, distance: 0});
      }

      this.cells = inorder;

        // WRONG, first make a copy not an inline sort!
//      var raw = cells.sort(function (a, b) {
//
//        if (a.normal === b.normal) {
//          // force a stable sort
//          // by using the id as secondary
//          return a.id - b.id;
//        }
//
//        // put the -1 values at the beginning
//        if (a.normal < 0) {
//          return -1;
//        }
//        if (b.normal < 0) {
//          return 1;
//        }
//        return Math.abs(a.normal) - Math.abs(b.normal);
//      });
//
//      this.raw = raw;


    };


    var _getData = function() {
      return this.cells;
    };

    //
    // public API
    //
    ZFConstructor.prototype = {
      constructor: ZFConstructor,

      getData:    _getData,
      setData:    _setData,

      getLength:  _getLength,

      getStats:  function() {return {n:   this.n,
                                     ave: this.ave,
                                     std: this.std};}

    };

    return ZFConstructor;

  })(); // returns the constructor for the module

  return module;

});