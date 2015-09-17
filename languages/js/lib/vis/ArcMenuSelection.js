/**
 * Created by mikeh on 5/2/14.
 */
 // http://bl.ocks.org/kerryrodden/7090426
// http://stackoverflow.com/questions/19260608/d3-sunburst-center-path-size

"use strict";

define(['d3', 'd3-tip', 'underscore'], function (d3, d3tip, us) {


  // constructor
  function ArcMenuSelection(config) {

    //
    // config.element MUST be defined
    //

    var defaults = config || {};
    defaults.name     = defaults.name     || 'noname';

    defaults.width   = parseInt(defaults.w) || 200;
    defaults.height  = parseInt(defaults.h) || 200;
    defaults.tooltip = defaults.tooltip     || 'arc-tooltip'; // e.g div. jquery selector

    defaults.radius = Math.min(defaults.width, defaults.height) / 2;
    defaults.color  = d3.scale.category20c();


    // see http://backstopmedia.booktype.pro/developing-a-d3js-edge/6-load-and-prep-the-data/
    // for the dispatch pattern

    var dispatch = d3.dispatch('menuSelect');
    d3.rebind(this, dispatch, "on");


    this.config   = defaults;
    this.dispatch = dispatch;
    console.log("ArcMenuSelection ", this.config);


    // call build
    _build.call(this, this.config);
  }

  var getStyleAttributes = function(d) {

    var fill   = d.isSelected ? d.selectedColor: d.orgColor;
    var stroke = d.isSelected ? "black" : "white";
    var sWidth = d.isSelected ? "2" : "1";

    return {  "fill":         fill,
              "stroke":       "#fff",
              "stroke-width": sWidth
              };
  };

  var resetAll = function() {
    var me = this;
    me.svg.selectAll("path").each(function(d,i) {
      d.isSelected = false;
      var map = getStyleAttributes(d);
      d3.select(this).style(map);
    });

    //}).style("fill", function(d,i) {
    //  //  var color = d.orgColor;
    //  //  d.isSelected = false;
    //  //  return color;
    //  //})

    me.selectedNodes = [];
    me.dispatch.menuSelect([], []);
  };

  var _build = function(config) {

    var me = this;
    var _reset = function(d) {
      resetAll.call(me);
    };


    var radius = config.radius;
    /*
    var x = d3.scale.linear()
      .range([0, 2 * Math.PI]);
    var y = d3.scale.sqrt()
      .range([0, radius]);
    */


    var svg = config.svg;
    if (typeof(svg) === 'undefined') {
      svg = d3.select(config.element).append("svg");
      config.svg = svg;
    }

    svg.attr("width",  config.width)
       .attr("height", config.height)
    ;

    var container = svg.append("g")
      .attr("transform", "translate(" + config.width / 2 + "," + config.height * .50 + ")");

    this.svg       = svg;
    this.container = container;

    var centerGroup = container.append('g')
        .on("click", _reset)
    //.style({'pointer-events':  'none' })
      ;
    var center = centerGroup.append("circle")
        .attr("r", radius / 3)
        .attr({"fill": "white",   // "none" for transparent but no mouse events then
              "stroke": "black",
              "stroke-width" : 0.25})
    //.on("click", reset)
      ;

    centerGroup.append("text")   // works on the svg element
      .attr("text-anchor", "middle")
      .style("width", function(d) { return 20 + "px"; })
      .attr("fill", "red")
      .attr("dx", 0)
      .attr("dy", "0.25em")
      .text("reset")
      .on("click", _reset)
    ;
    // a tooltip must be a child under the svg element
    // so that transforms are easy  (e.g. using arc.centroid(d))
    // if not, you have to position based on absolute values (e.g. d3.event.pageX )
    //


    var tooltipClass = 'arc-tooltip';
    var ttelement = d3.select('div.' + tooltipClass);
    var html = ttelement.html();
    this.ttip_template = us.template(us.unescape(html));

    var tooltip = ttelement.html("holding zone")
      .style({"text-anchor" : 'middle',
              "opacity" : 0});


    this.arc = d3.svg.arc()
      .startAngle(function(d)  { return d.x; })
      .endAngle(function(d)    { return d.x + d.dx; })
      .innerRadius(function(d) { return Math.sqrt(d.y); })
      .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); })
    ;
    // if size == 100 (rather than config.radius^2)
    this.arc = d3.svg.arc()
      .startAngle(function(d)  { return d.x; })
      .endAngle(function(d)    { return d.x + d.dx; })
      .innerRadius(function(d) { return config.radius * d.y / 100.0; })
      .outerRadius(function(d) { return config.radius * (d.y + d.dy) / 100.0; })
    ;
    // see https://github.com/mbostock/d3/wiki/Partition-Layout
    // data is assumed to be recursive (children attribute)
    this.partition = d3.layout.partition()
        .sort(function(a,b) {

          // in order by alpha
          var ai = a.label.toLowerCase();
          var bi = b.label.toLowerCase();
          var alpha = ai.localeCompare(bi) ;    // return a.label - b.label;

          // in order by key
          var byId = a.key - b.key;

          var sort = (typeof(a.key) === 'undefined') ? alpha : byId;

          return sort;

        })
         // why 2* pi?  http://www.tauday.com/tau-manifesto
         // returns [x,y]
        .size([2 * Math.PI, 100]) // config.radius * config.radius])
        .value(function(d) {
           return d.responseCount;
        })
      ;

  };  // end of _build


//      var text = svg.append("text")
//        //.attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
//        //.attr("x", function(d) { return y(d.y); })
//        .attr("dx", "6") // margin
//        .attr("dy", ".35em") // vertical-align
//        .text(function(d) { return d.name; });


  /*
   this tooltip doesn't work on arcs .. sometimes
   the posistioning is not correct
   unable to fix it using offsets, since it works for most arc

   var tooltip = d3tip().html(function(d) {
   console.log("gen html", d);
   var out = d.name;
   return out;
   }
   )
   .attr('class', "zflower-tooltip")
   .offset([0, 0])
   ;

   svg.call(tooltip);
   */



  var getDescendents = function(d) {
    //This function will return an array of DOM elements representing
    //the element associated with the passed-in data object and all it's
    //child elements and their children and descendents as well.

    if (d.children === null || typeof(d.children) === 'undefined' || d.children.length == 0){
      //This object doesn't have any children, so return an array of length 1
      //containing only the DOM element associated with it.
      // return [d.DOMobject];
      return [d];  // it's a leaf node, return it
    }
    else {
      //Create an array that consists of the DOM element associated
      //with this object, concatenated (joined end-to-end)
      //with the results of running this function on each of its children.
      // var desc = [d]; //start with this element
      var desc = [];
      d.children.forEach(function(d){
        desc = desc.concat(getDescendents(d));
      });
      return desc;
    }
  };

  var _findRole = function(node, idx) {

    var label = node.label;
    var key = node.key;
    var indexOfKeys = node.indexOfKeys;
    var children = node.children;

    if (typeof (children) === 'undefined') {

      if (indexOfKeys.indexOf(idx) >= 0) {
        return node;
      }
      return undefined;
    }


    for (var i = 0; i < children.length; i++) {

      var ans = _findRole(children[i], idx);
      if (typeof(ans) !== 'undefined') {
        return ans;
      }
    }
  };


    /* this algorithm finds the parent first
    since indexOfKeys is the union of it's children's sets

    if (indexOfKeys.indexOf(idx) >= 0) {
      return node;
    }

    var children = node.children;
    if (typeof (children) === 'undefined') {
      return undefined;
    }

    for (var i = 0; i < children.length; i++) {

      var ans = _findRole(children[i], idx);
      if (typeof(ans) !== 'undefined') {
        return ans;
      }
    }

    return undefined;
   };
   */


  var _selectRoleWithKeyIndex = function(idx) {

    console.log("FIND ", this.roleData, idx);

    //                   this is the wrapper object
    var node = _findRole(this.roleData.children[0], idx);

    console.log("FOUND ", this.selectedNodes, node);
    handleClickEvent.call(this, node);

  };

  var handleClickEvent = function(d) {

    var me = this;

//            console.log("Parent ", d.parent.parent);
//            console.log("parent", d3.select(d.parentNode));
//
    console.log("click", d);
    console.log("is node selected", d.isSelected);
    console.log("total nodes selected", me.selectedNodes.length);
    console.log("node descendants", d.descendants.length);

//            var color = d.isSelected ? d.orgColor : d.orgColor.darker();
//            d3.select(this).style("fill", color);
//            d.isSelected = ! d.isSelected;

    // descendants includes the node clicked on as well
    var nodesOn = [];
    var nodesOff = [];
    d.descendants.forEach(function(n){
      // if a node was selected and it was clicked on, un-select it
      n.isSelected = ! n.isSelected;

      var styles = getStyleAttributes(n);
      d3.select('#'+n.myId).style(styles);

      if (n.isLeaf) {

        if (n.isSelected) {
          nodesOn.push(n);
        } else {
          nodesOff.push(n.myId);
        }
      }

    });
    console.log("selected Nodes",  me.selectedNodes.length);
    console.log("nodes on",  nodesOn.length);
    console.log("nodes off", nodesOff.length);

    // 3 cases:
    // nodesOn  are IN the selected set: do nothing
    // nodesOff are IN the selected set: remove them
    //
    var totalNodesOn = [];
    me.selectedNodes.forEach(function(n) {

      var remove = nodesOff.indexOf(n.myId) != -1;

      if (!remove) {
        // console.log("add ", n.myId);
        totalNodesOn.push(n);
      }

    });

    console.log("nodes on",  nodesOn.length);
    console.log("total nodes on",  totalNodesOn.length);

    // merge the two arrays
    Array.prototype.push.apply(totalNodesOn, nodesOn);

    console.log("AFTER nodes on",  nodesOn.length);
    console.log("AFTER total nodes on",  totalNodesOn.length);


    // nodesOn: which nodes were turned on with this click
    // newSet:  all the selected nodes
    me.selectedNodes = totalNodesOn;
    me.dispatch.menuSelect(nodesOn, totalNodesOn);
  };

  var _setData = function (roles) {

    // this outer wrapper is used if you want an inner ring
    var wrapper = {
      key:-1000,
      isWriteIn: false, label:"ignore", children : [roles], responseCount:0 };

    roles = wrapper;
    this.roleData = roles;

    console.log("arcMenu.setData()", roles);

    var me        = this;
    var container = this.container;
    var color     = this.config.color;

    this.selectedNodes = [];

    // remove all nodes with no responses
    var nodes = this.partition.nodes(roles).filter(function(d,i) {

      return true;

      return d.responseCount > 0 && ! d.isWriteIn;

      if (d.responseCount == 0) {
        console.log("removing no children", d.label);
      }
      else if (d.isWriteIn) {
        console.log("removing other", d.label);
      }
      //console.log("keeping", d.label, d.responseCount > 0);
      return !(d.responseCount == 0 || d.isWriteIn);
    });

    var processEach = function(d,i) {

      var orgColor = color((d.children ? d : d.parent).label);

      if (typeof(d.isSelected) === 'undefined') {
        //
        // if d.isSelected = false, then
        // we will hold onto selected nodes, between calls to setData
        // which is not good
        // if we want to persist selectedArcs, handle differently
      }

      d.isSelected = false;

      d.isLeaf = typeof(d.children) === 'undefined' || d.children.length == 0;

      d.orgColor      = d3.rgb(orgColor); // this.style.fill);
      d.selectedColor = d.orgColor.darker();
      d.descendants   = getDescendents(d);

      // console.log("set id", d, d.key);
      // set the id attribute here
      // used for selecting
      //var myId = 'role' + i;
      var myId = 'role' + d.key;
      d.myId = myId;

      var styles = getStyleAttributes(d);
      var theItem = d3.select(this).attr("id", myId).style(styles);
    };


    var arcs = container.selectAll("path")
        .data(nodes, function(d) {
          return d.key.toString();
        });

    // UPDATE SELECTION
    arcs.transition().duration(500)
      .each(processEach)
      .attr("d", this.arc)
    ;

    // EXIT/REMOVE
    arcs.exit().each(function(d,i) {
      console.log("EXIT called on ", d.myId);
    }).transition().duration(250).style('opacity', 0.0).remove();


    // ENTER SELECTION
    arcs.enter().append("path")
          .each(processEach)
          .attr("display", function(d) {
            if (d.depth == 0) {
              return "none";
            }
           // TO KEEP the writeIns
           return null;    // comment this line to 'hide' the writeIn/Other
            // the inner ring is removed in the filter function
            // you could do depth == 0 test
            // if you remove the 'write in'/Other children
            // the parent becomes unselectable,
            // because of the algorithm used in the 'click' handler
            // it only considers 'leaf' nodes vs selected nodes with 'hidden' children
            // just hide those 'other' write in leaves
            return d.isWriteIn ? "none": null;
          })
          .attr("d", this.arc)

          //.style("stroke", "#fff")
          //.style("fill", _fillColor)
          .style("fill-rule", "evenodd")


//          .on("mouseover", function(d,i) {
//             var me = d3.select(this);
//             var pathEle = me.node();
//             console.log(arc.centroid(d));
//             tooltip.offset(arc.centroid(d));
//             tooltip.show(d, pathEle);

//             var matrix =
//              this.getTransformToElement(svg.node())
//                .translate(+this.getAttribute("cx"), +this.getAttribute("cy"));
//
//           })
//       .on("mouseout",  tooltip.hide)
         .on("mouseover", function(d,i) {

          var html = me.ttip_template({"text" : d.label + ':' + d.responseCount});
          var pos  = me.arc.centroid(d);

          var tt   = d3.select('div.arc-tooltip');
          tt.html(html);
          var textWidth = tt.node().clientWidth;

          // var point = svg.node().createSVGPoint();

          //var box =  _getScreenBox(this, point);
          // console.log("screen", box.bb.x, box.bb.y);
          // http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
          // http://stackoverflow.com/questions/21153074/d3-positioning-tooltip-on-svg-element-not-working

          // var tooltipParent = tt[0][0].parentElement;   // works, but tt.node() is cleaner
          // var tooltipParent = tt.node();

          // we need screen coordinates, since this is an html fragment and not SVG
          var matrix = this.getScreenCTM()
            .translate(+this.getAttribute("x"), +this.getAttribute("y"));

          //
          // (0,0) is the center of the arc
          // centroid is relative to 0,0
          //
          var pos = me.arc.centroid(d);
          // console.log(matrix, window.pageXOffset,window.pageYOffset) ;

          tt.attr({"dy": "0.50em"})
            .style({"text-anchor" : 'middle',
              "opacity": .90,
              "left": (window.pageXOffset + matrix.e + pos[0] - textWidth/2.0) + "px",
              // add a little to move off the mouse
              "top":  (window.pageYOffset + matrix.f + pos[1] + 5) + "px"});


        })
        .on("mouseoverSVG", function(d, i){

          // works for an SVG tooltip
          // but can't 'render' html inside of it
          // have to style it


          var html = me.ttip_template({"text" : d.label});

          var tt = container.select('text.arc-tooltip');
          var pos = arc.centroid(d);
          tt.text(html);

          tt.transition()
            .duration(100)
            .attr("transform", function(d) { return "translate(" + pos + ")"; })
            .attr({"dy": "0.50em"})
            .style("opacity", .9);
        })
        .on("mouseout", function(d,i){

          d3.select('div.arc-tooltip')
            //.transition().duration(100)
            .style("opacity", 0.0);
        })
        .on("click", function(d, i) {

           handleClickEvent.call(me, d);
        })

       // end of process

      ;

  }; // end of setData

  ArcMenuSelection.prototype = {
    constructor: ArcMenuSelection,
    setData: _setData,

    selectRoleWithKeyIndex: _selectRoleWithKeyIndex,
    resetAll: resetAll,

    getAllSelectedNodes: function() {
      return this.selectedNodes;
    }
  };

  return ArcMenuSelection;




  /*
   var arc = d3.svg.arc()
   .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
   .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
   .innerRadius(function(d) { return Math.max(0, y(d.y)); })
   .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
   */

  // svg.data([roles]).selectAll("path")  (and don't init partiion.nodes(roles





  // to create an svg based tooltip
//      var tooltip = container.append('text')
//        .attr({"class": tooltipClass})
//        .text("hi mike")
//       ;



//      centerGroup.selectAll('text')
//        .data(partition.nodes(roles))
//        .enter()
//        .append("text")
//        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
//        .attr("dy", "0")
//        .attr("text-anchor", "middle")
//        .text(function(d) { return d.value; });


  //.each(stash);

  /*d3.json("roles.json", function(error, root){

   console.log("inside", error, root);
   //        partition.nodes(root)
   //          .children(function(d, depth) {
   //             console.log("request", d);
   //             return d.children;
   //           })
   //          ;


   var path = svg.data([root]).selectAll("path")
   .data(partition.nodes)
   .enter().append("path")
   .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
   .attr("d", arc)
   .style("stroke", "#fff")
   .style("fill", function(d) { return color((d.children ? d : d.parent).label); })
   .style("fill-rule", "evenodd")
   //.each(stash);
   });
   */

  /*

   // partition.value(function(d) {return d.count});
   var data =  rolesIT; // var jsonData = JSON.stringify(rolesIT);
   partition.nodes(rolesIT)
   //        .forEach(function(d) {
   //           console.log("found ", d);
   //        })
   ;

   console.log("nodes", partition.nodes());
   */


});