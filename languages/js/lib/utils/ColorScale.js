define(['d3'], function (d3) {

  // the module
  "use strict";

  var module = (function () {

    //
    // static vars go here
    // i.e. variables that SHARED among all instances
    //
    var redYellowGreen = d3.scale.linear()
      .domain([-1,      0,      0.5,     1.0])
      .range(["white", "red", "yellow", "green"]);

    var blueWhiteOrange = d3.scale.linear()
      .domain([-1,       0,      0.5,     1.0])
      .range(["#FFFFBF", "blue", "white", "orange"]);
      // was black, but yellow (#FFFFBF) works better for -1

    var blues = d3.scale.linear()
      .domain([-1,      0,      1.0])
      .range(["#FFFFBF", "white", "blue"]);

    var whiteBlue  = d3.scale.linear()
      .domain([-1,      0,      1.0])
      .range(["orange", "white", "blue"]);

    var heatMap  = d3.scale.linear()
      .domain([-1,      0,        0.25,      0.50,      0.75,       1.0])
      .range(["white", '#e4ff7a', '#ffe81a', '#ffbd00', '#ffa000', '#fc7f00']);

    // used colorBrewer:  color blind friendly, divergent, 11 size
    var colorBrewer2 = d3.scale.linear()
      .domain([-1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
      .range([
        '#FFFFBF', // -1 a yellow
        '#8E0152', // 0
        '#C51B7D', // 0.1
        '#DE77AE', // 0.2
        '#F1B6DA', // 0.3
        '#FDE0EF', // 0.4
        '#F7F7F7', // 0.5
        '#E6F5D0', // 0.6
        '#B8E186', // 0.7
        '#7FBC41', // 0.8
        '#4D9221', // 0.9
        '#276419']);

    /*var colorBrewer6 = d3.scale.linear()
      .domain([-1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
      .range([
        '#FFFFFF', // -1
        '#A50026', // 0
        '#D73027', // 1
        '#F46D43', // 2
        '#FDAE61', // 3
        '#FEE090', // 4
        '#FFFFBF', // 5
        '#E0F3F8', // 6
        '#ABD9E9', // 7
        '#74ADD1', // 8
        '#4575B4', // 9
        '#313695'  // 10
      ]);*/

    // these are inverted (greens become red in colorblind mode)
    var colorBrewer6 = d3.scale.linear()
      .domain([-1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
      .range([
        '#FFFFFF', // -1
        '#313695', // 10
        '#4575B4', // 9
        '#74ADD1', // 8
        '#ABD9E9', // 7
        '#E0F3F8', // 6
        '#FFFFBF', // 5
        '#FEE090', // 4
        '#FDAE61', // 3
        '#F46D43', // 2
        '#D73027', // 1
        '#A50026'  // 0
    ]);

    var colorBrewerBlues9 = d3.scale.linear()
      .domain([-1,  0,   1.0/9.0, 2.0/9.0, 3.0/9.0, 4.0/9.0, 5.0/9.0, 6.0/9.0, 7.0/9.0, 8.0/9.0, 1.0])
      .range([
        '#FFFFBF', // -1 yellow, added
        '#FFFFFF', // 0  white,  added
        '#F7FBFF', // 1
        '#DEEBF7', // 2
        '#C6DBEF', // 3
        '#9ECAE1', // 4
        '#6BAED6', // 5
        '#4292C6', // 6
        '#2171B5', // 7
        '#08519C', // 8
        '#08306B'  // 9
      ]);

    var grayScale  = d3.scale.linear()
      .domain([-1,        0,         1.0])
      .range(["#FFFFFF", '#D9D9D9', '#252525']);


    // constructor
    var colorscale = function () {

      var ColorEnum = {

        // linear
        "WHITE-BLUE" : blues,

        // these are divergent scales
        "RYG": redYellowGreen,
        "BWO": blueWhiteOrange,
        "CB1": colorBrewer2,
        "CB2": colorBrewer6,

        // these are linear scales
        "HM":  heatMap,
        "BL":  colorBrewerBlues9, // blues,
        "BW":  grayScale
      };

      this.scales = ColorEnum;
      this.cs     = ColorEnum["RYG"];
    };


    //
    // private functions
    //
    

    //
    // public methods
    //

    var setColorScheme = function(idx) {
      // assume it's one of 'BW', 'RYG', etc
      var cs = this.scales[idx];
      if (typeof(cs) === 'undefined') {
        // assume it's an integer idx
        var keys = Object.keys(this.scales);
        var cnt = idx % keys.length;
        var key = keys[cnt];
        cs = this.scales[key];
      }

      if (typeof cs === 'undefined') {
        // console.log("no color scale found: ", idx);
        cs = this.scales['RYG'];
      }

      this.cs = cs;
    };

    var getColor = function(value) {
      return this.cs(value);
    };

    var getScale = function() {
      return this.cs;
    };



    //
    // exposed public API
    //
    colorscale.prototype = {
      constructor:    colorscale,

      setColorScheme: setColorScheme,
      getScale:       getScale,
      getColor:       getColor
    };



    // return the constructor
    return colorscale;


  })();


  // return the module
  return module;
});
