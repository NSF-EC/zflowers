/**
 * Created by mikeh on 5/2/14.
 */


"use strict";

define(['HexCellBuilder', 'ColorScale', 'd3', 'd3-tip', 'underscore'], function (HexBuilder, ColorScale, d3, d3tip, us) {

  // constructor
  function ZFlowerVis(config) {

    //
    // config.element MUST be defined
    //

    var defaults = config || {};
    defaults.fontSize    = parseFloat(defaults.fontSize) || 10.0;
    defaults.name        = defaults.name || 'noname';
    defaults.autoScaleTo = parseInt(defaults.autoScaleTo) || 0;

    defaults.viewWidth  = parseInt(defaults.w) || 100;
    defaults.viewHeight = parseInt(defaults.h) || 100;
    defaults.transform  = defaults.transform || "translate(0,0)";
    defaults.bgColor    = defaults.bgColor   || '#EEEEEE';

    if (typeof(defaults.tooltip) !== 'undefined') {
      //  'zflower-tooltip'  e.g div. jquery selector
    }

    if (typeof(defaults.ignoreEvents) === 'undefined') {
      defaults.ignoreEvents = false;
    }

    defaults.cm = defaults.cm || 'RYG';

    var cs = new ColorScale();
    cs.setColorScheme(defaults.cm);
    defaults.colorScale = cs;

    // as cells are added to the flower, the default is to scale the cells
    // to fit within the bounding box
    // if autoScale is non-zero, then a static transform is applied
    // and the cells are constant in size
    //


    // clients can listen for 'hexSelect' and 'hexDeselect' events
    // e.g zFlower.on('hexSelect', function(singleNode, currentlySelected) {}
    // hexSelect happens on a mouseClick
    var dispatch = d3.dispatch('hexSelect', 'hexClearAll', 'hexDeselect');
    d3.rebind(this, dispatch, "on");

    this.dispatch = dispatch;
    this.selectedCells = [];

    this.config = defaults;

    // call build
    _build.call(this, this.config);
  }



  var _build = function(config) {

    var svg = config.svg;
    if (typeof(svg) === 'undefined') {
      svg = d3.select(config.element).append("svg");
      config.svg = svg;
    }
    svg.attr("width",  config.viewWidth)
       .attr("height", config.viewHeight)
       .attr('class', 'zFlowerPlotSVG')
      .attr('id',    config.name)
    ;


    var chart = svg.append('g')
      .attr('class',  "chart")
      .attr('transform', config.transform)
      ;

    var plotContainer = chart.append('g')
      .attr('class', "hexplot");

    // what gets drawn last is what's 'on top'
    // you can't control z order in svg
    // so we will use overlay group to attach
    // nodes that need to be highlighted
    //
    /*
    var outline = svg.append('rect')
      .attr('class', 'outline')
      .attr('width',  config.viewWidth)
      .attr('height', config.viewHeight)
      .style({
         'fill':            "rgba(0, 0, 0, 0)",  // invisible
          'stroke':         "rgba(0, 0, 0, 1)",  // black
         'pointer-events':  'none'
      })
     ;
     */
    this.overlay = chart.append('g');

     /*
     .on('mouseover', function(d,i) {
     //var tooltip = $(defaults.tooltip);
     var tooltip = d3.select(defaults.tooltip);
     tooltip.transition().duration(500).style("opacity", 0);
     })
     ;
     */


    this.chart         = chart;
    this.plotContainer = plotContainer;
    this.svg           = svg;

    if (typeof(config.tooltip) !== 'undefined') {

      // console.log("creating tooltip for", config.tooltip);

      // get the html from the tooltip
      // unescape the contents (otherwise you get &lt; &gt, etc
      // compile the template

      // var ttelement = $('div.' + config.tooltip);
      var ttelement = d3.select('div.' + config.tooltip);
      // console.log("found tooltip element ", ttelement);

      var html = ttelement.html();
      var template = us.template(us.unescape(html));

      //
      // create a new div for the tooltip
      // based on the template div
      //
      var tooltip = d3tip().html(function (d) {

            var v = parseFloat(Math.round(d.userData.value * 100) / 100).toFixed(2);
            var out = template({ value: v,
              id: d.userData.id});
            return out;
          }
        )
          .attr('class', config.tooltip)
          .offset([0, 0])
        ;

      svg.call(tooltip);
      this.tooltip = tooltip;
    }else {
      // console.log("no tooltip installed");
      this.tooltip = undefined;
    }


    if (config.autoScaleTo > 0) {

      var hexBuilder = new HexBuilder(config.autoScaleTo);
      var cells  = hexBuilder.cells;
      var hexGeo = hexBuilder._hexGeo;

      var transform = buildTransform.call(this, hexGeo);
      var tx = transform['transform'];
      console.log("setting static transform ", config.autoScaleTo, config.name, tx, transform);
      this.plotContainer.attr('transform',  tx);
    }

    // HACK
    // this.point = svg.node().createSVGPoint();

  }; // end _build



  var buildTransform = function(hexGeo) {

    var margin = 10.0;
    if (hexGeo.count === 1) {
      // NOT sure if this is the best thing to do
      // but the single hexagon in the center, the stroke width
      // is too big
      margin = 50.0;
    }

    var sx = (this.config.viewWidth  - margin) / hexGeo.width;
    var sy = (this.config.viewHeight - margin) / hexGeo.height;
    // console.log("scale", sx, sy, hexGeo);

    var dx = this.config.viewWidth/2.0;
    var dy = this.config.viewHeight/2.0;

    var Tx         = 'translate(' + dx + ',' + dy + ')';
    var Sx         = 'scale(' + sx + ',' + sy + ')';
    // console.log("scale", sx, sy, Sx);

    // var Rx      = 'rotate(' + -45.0 + ')';
    var transformSxTx = Tx + ' ' + Sx; //  + ' ' + Rx; // ORDER matters
    var transformTx   = Tx;

    return {transform: transformSxTx,
            sx: sx,
            sy: sy,
            dx: dx,
            dy: dy};
  };

  var d3line2 = d3.svg.line()
    .x(function(d){return d.x;})
    .y(function(d){return d.y;})
    .interpolate("linear");


  var _getSelectedIds = function() {
    //
    // this.selectedCells are the hex cells
    // need to reduce this down to an array of ids
    //

    var out = this.selectedCells.map(function(d, i) {
      return d.userData.id;
    }) ;

    return out;

  }


  //  <g.plot>
  //      <g.hex> <path> <text> </g>
  //      <g.hex> <path> <text> </g>
  // </g>
  var _setSelected = function(values) {

    // values is an array of ids (e.g. [ 10, 21, 33, 7]);

    if (typeof(this.zf) === 'undefined') {
      console.log("setSelected: no data yet");
      return;
    }

    var selected = this.hexBuilder.cells.filter(function(d) {
      return values.indexOf(d.userData.id) != -1;
    });
    this.selectedCells = selected;

    // console.log("zFlower.setSelected()");
    this.update();

  };

  var isIdSelected = function(id) {
    for (var i = 0; i < this.selectedCells.length; i++) {
      if (this.selectedCells[i].userData.id === id)  {
        return true;
      }
    }
    return false;
  };

  var _setData = function(zflower) {

    // console.log("zFlower.setData()");

    this.zf = zflower;
    var n = this.zf.getLength();

    var hexBuilder = new HexBuilder(n);
    var cells  = hexBuilder.cells;
    var hexGeo = hexBuilder._hexGeo;
    this.hexBuilder = hexBuilder;

    // map cells to the userData
    var values = [];
    var data = zflower.getData();
    var cells = hexBuilder.cells;
    var me = this;
    cells.map(function(cell, i) {
      cell.userData = data[i];

      // add the cell as selected, if the ids match
      if (isIdSelected.call(me, cell.userData.id)) {
        values.push(cell);
      }

    });
    // update the selectedCells, could be an option
    // this.selectedCells = values;
    this.selectedCells = [];    // clear them out


    if (this.config.autoScaleTo === 0) {
      var transform = buildTransform.call(this, hexGeo);
      var tx = transform['transform'];
      // console.log("setting dynamic transform ", this.config.name);
      this.plotContainer.attr('transform',  tx);
      this.overlay.attr('transform',  tx);
      this.transformData = transform;
    }


    //console.log("zf data count ", n);
    //console.log("stats", this.zf.getStats());
    //console.log("cells", hexBuilder.cells);

    this.update();
  };

  var _setColorModel = function(cm) {
    var cs = this.config.colorScale;
    cs.setColorScheme(cm);

    this.update();
  };


  var _update = function() {

    var me = this;

    // console.log("update Called, selected nodes", this.selectedCells);

    if (! this.zf) {
      // console.log("zFlower update called, but NO Data yet");
      return;
    }


    var cells = this.hexBuilder.cells;
    var stats = this.zf.getStats();

    //console.log("update ", cells); // this.config);


    var colorScale = this.config.colorScale;
    var fillColor = function(d, i){
      // var n = d.userData.normal * 1.0;
      // console.log('upd fill for ', i, d.birthOrder, d.userData.id);
      return colorScale.getColor(d.userData.normal);
    };


    var strokeWidth = function(d,i) {

      if (cells.length == 1) {
        return 0.025;
      }

      // cell 0 is painted first, so 1/2 of
      // it's stroke width will be covered
      // by its neighbors
      if (cells.length < 2) {
        return 0.05;
      }

      if (i === 0) return 0.40;
      return 0.05;

//      if (i === 0) return 0.20;
//
//      // use underscore.js to help us out here
//      var isIn = us.contains(highlight, d.userData.id);
//      console.log(isIn, d.userData.id, highlight);
//
//      if (isIn) {
//        return 0.20;
//      }
//      return 0.05;
    };

    var strokeColor = function(d, i) {

      if (i == 0) {


        // std is calculated over [0,1]
        // hence the biggest std is 0.5
        var blues = d3.scale.linear()
          .domain([0,      0.5])
          .range(["white", "blue"]);
        return blues(stats.std);
      }
      return 'black';
    };

    // attach the data
    var bars = this.plotContainer.selectAll('path')

        .data(cells, function(d) {

          //return d.birthOrder;
          return d.userData.id.toString();
        })
      ;


    //UPDATE the existing ones
    bars.transition().duration(500)
      .style('fill',      function(d,i) {
        return fillColor(d,i);
      })

      .style('stroke',       strokeColor)
      .style('stroke-width', strokeWidth)

      .attr("d",          function(d) {return d3line2(d.pathInfo) + " Z";})
      .attr('transform',  function(d) {return d.transform;})

    ;


    // ADD the NEW
    bars.enter().append('path')
      .attr("d",          function(d) {return d3line2(d.pathInfo) + " Z";})
      .attr('transform',  function(d) {return d.transform;})
      .style('fill',      function(d,i) {
        //console.log('new fill for ', d.birthOrder, d.userData.id);
        return fillColor(d,i);
      })

      .style('stroke', strokeColor)
      .style('stroke-width',strokeWidth)

      /*
      .classed('inactive',  true)
      .classed('active',  function(d) {return d.userData.id == 10;})
      .classed({'foo': true, 'bar': false})
      */

      .on("mouseover", function(d,i) {

        if (typeof(me.tooltip) !== 'undefined') {
          // console.log("m.over");
          me.tooltip.show(d,i);
        }
      })
      .on("mouseout",  function(d,i) {
        //this.tooltip.hide

        if (typeof(me.tooltip) !== 'undefined') {
          me.tooltip.hide();
        }

      })
      .on("click", function(d,i) {

        if (me.config.ignoreEvents){
          console.log("clicked ignored: set ignoreEvents = false", d.userData);
          return;
        }


        if (i == 0) {
          // center hex was selected
          // clear all
          _setSelected.call(me, []);
          me.dispatch.hexClearAll();
          return;
        }

        var id  = d.userData.id;
        var ids = _getSelectedIds.call(me);
        var idx = ids.indexOf(id);

        if (idx == -1) {
          ids.push(id);
        }
        else {
          ids.splice(idx, 1);
        }

        // console.log("dispatching hexSelect");

        _setSelected.call(me, ids);
        me.dispatch.hexSelect([id], me.selectedCells);

      })
      .on("clickOLD", function (d,i) {

        if (typeof(me.config.ignoreDispatch) === 'undefined' || me.config.ignoreDispatch) {
          console.log("clicked ignored: set ignoreDispatch = false", d.userData)
          return;
        }

        console.log("click handler disabled");
        return;


        if (i == 0) {
          // center hex was selected
          // this is the 'reset'
          // clear all
          me.setSelected([]);
          me.dispatch.hexDeselect([], []);
          return;
        }

        var id = d.userData.id;
        var ids = _getSelectedIds.call(me);
        var idx = ids.indexOf(id);

        if (idx == -1) {

          ids.push(id);
          _setSelected.call(me, ids);
          me.dispatch.hexSelect([id], me.selectedCells);
        }
        else {
          ids.splice(idx, 1);
          _setSelected.call(me, ids);
          me.dispatch.hexDeselect([id], me.selectedCells);

        }

       })
      .on("mouseoverOLD", function(d,i) {

        if (zFlower.onSelect) {

          zFlower.onSelect(d);

          // first reposition the tooltip
          moveTooltip.call(this, d, i);

          var tooltip = d3.select(zFlower.config.tooltip);
          tooltip.transition().duration(500).style("opacity", 0.85);

        }else {
          console.log("onSelect not set");
        }


      })

    ;

    // EXIT/REMOVE
    bars.exit().transition().duration(250).style('opacity', 0.0).remove();


    //var bars = this.plotContainer.selectAll('path');
    //console.log("total bars ", bars);


    // HANDLE the overlay and nodes that are highlighted
    // it would be easier to just
    // adjust the strokeWidth on the hexplot paths (above)
    // BUT svg has no way to force a z-order
    // so we use an overlay group
    // that gets painted last to achieve the same effect
    //
//    var highlight = this.highlight;
//    var highlighted = cells.filter(function(d){
//      return us.contains(highlight, d.userData.id);
//    });

    //
    // when a hex-node is highlighted, we
    // increase it's stroke width
    //
    var highlightStrokeWidth = function(d,i) {
      if (i == 0) return 0;
      return 0.20;
    };
    var barsOver = this.overlay.selectAll('path')
        .data(this.selectedCells, function(d) {
          //return d.birthOrder;
          return d.userData.id.toString();
        })
      ;
    barsOver.enter().append('path')
      .attr("d",          function(d) {return d3line2(d.pathInfo) + " Z";})
      .attr('transform',  function(d) {return d.transform;})
      .style({
        'fill':            fillColor,
        'stroke-width': highlightStrokeWidth,
        'stroke':         'black',
        'pointer-events':  'none'
      })
    ;
    //UPDATE the existing ones (see effects when the zflower is animating (changing in size)
    barsOver.transition().duration(500)
      .attr("d",          function(d) {return d3line2(d.pathInfo) + " Z";})
      .attr('transform',  function(d) {return d.transform;})
      .style({
        'fill':            fillColor,
        'stroke-width': highlightStrokeWidth,
        'stroke':         'black',
        'pointer-events':  'none'
      })
    ;
    // EXIT/REMOVE
    barsOver.exit().transition().duration(250).style('opacity', 0.0).remove();

  };


  ZFlowerVis.prototype = {
    constructor: ZFlowerVis,
    setData: _setData,
    getData: function() {return this.zf;},

    update: _update,
    setSelected: _setSelected,

    setColorModel: _setColorModel
  };

  return ZFlowerVis;
});