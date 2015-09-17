/**
 * Created by mikeh on 06/01/2015
 *
 */
define([], function () {

  // the module
  "use strict";

  var myMod = (function() {

    //
    // static vars go here
    // i.e. variables that SHARED among all instances
    //


    // constructor
    var modConstructor = function (someString) {
      // _buildMap.call(this);

      this.js = JSON.parse(someString);
    };


    //
    // private functions
    //
    var _buildMap = function () {

    };


    //
    // modified from https://gist.github.com/iwek/3924925
    //
    var _getObjects = function(obj, key, val) {
      var objects = [];
      for (var i in obj) {
        if (!obj.hasOwnProperty(i)) {
          continue;
        }
        if (typeof obj[i] == 'object') {
          objects = objects.concat(getObjects(obj[i], key, val));
        }
        else {
          //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
          if (i == key && obj[i] == val || i == key && val == '') { //
            objects.push(obj);
          }
          else if (obj[i] == val && key == '') {
            //only add if the object is not already in the array
            if (objects.lastIndexOf(obj) == -1) {
              objects.push(obj);
            }
          }
        }
      }
      return objects;
    };

    //return an array of values that match on a certain key or value
    var _getKeyOrValues = function(obj, kv, isKey) {
      var objects = [];
      for (var i in obj) {
        if (!obj.hasOwnProperty(i)) {
          continue;
        }
        if (typeof obj[i] == 'object') {
          objects = objects.concat(_getKeyOrValues(obj[i], kv, isKey));
        }
        else if (isKey && (i == kv)) {
          objects.push(obj[i]);
        }
        else if (!isKey && (obj[i] == kv)) {
          objects.push(i);
        }
      }
      return objects;
    };


    //
    // public methods
    //


    //
    // exposed public API
    //
    modConstructor.prototype = {

      constructor: modConstructor,

      getKeysForValue: function(value) {
        return _getKeyOrValues(this.js, value, false);
      },

      getValuesForKey: function(key) {
        return _getKeyOrValues(this.js, key, true);
      }

    };

    // return the constructor
    return modConstructor;


  })();

  /*
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports.JSONSearchTool = myMod;
  }
  else {
    window.JSONSearchTool = myMod;
  }

   })();
  */

  // return the module
  return myMod;
});

