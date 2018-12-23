var error_msg = [
    'Try again Shreya',
    'Coommeee onnn Shreya, Wrong Answer!',
    'Give up Shreya',
    'Close ............................................................................ just kidding'
];

function arrayMin( array ) {

  if ( array.length === 0 ) return Infinity;

  var min = array[ 0 ];

  for ( var i = 1, l = array.length; i < l; ++ i ) {

    if ( array[ i ] < min ) min = array[ i ];

  }

  return min;

}

function arrayMax( array ) {

  if ( array.length === 0 ) return - Infinity;

  var max = array[ 0 ];

  for ( var i = 1, l = array.length; i < l; ++ i ) {

    if ( array[ i ] > max ) max = array[ i ];

  }

  return max;

}

if ( Number.EPSILON === undefined ) {

  Number.EPSILON = Math.pow( 2, - 52 );

}

if ( Number.isInteger === undefined ) {

  // Missing in IE
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger

  Number.isInteger = function ( value ) {

    return typeof value === 'number' && isFinite( value ) && Math.floor( value ) === value;

  };

}

//

if ( Math.sign === undefined ) {

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign

  Math.sign = function ( x ) {

    return ( x < 0 ) ? - 1 : ( x > 0 ) ? 1 : + x;

  };

}

if ( 'name' in Function.prototype === false ) {

  // Missing in IE
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name

  Object.defineProperty( Function.prototype, 'name', {

    get: function () {

      return this.toString().match( /^\s*function\s*([^\(\s]*)/ )[ 1 ];

    }

  } );

}

if ( Object.assign === undefined ) {

  // Missing in IE
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

  ( function () {

    Object.assign = function ( target ) {

      'use strict';

      if ( target === undefined || target === null ) {

        throw new TypeError( 'Cannot convert undefined or null to object' );

      }

      var output = Object( target );

      for ( var index = 1; index < arguments.length; index ++ ) {

        var source = arguments[ index ];

        if ( source !== undefined && source !== null ) {

          for ( var nextKey in source ) {

            if ( Object.prototype.hasOwnProperty.call( source, nextKey ) ) {

              output[ nextKey ] = source[ nextKey ];

            }

          }

        }

      }

      return output;

    };

  } )();

}

function myFunction() {
  var x, text;

  x = document.getElementById("answer").value;

  if (x==113) {
    // document.getElementById("demo").innerHTML = text;
   location.href = "http://vikastmz.github.io/quiz/80085.html";
  } else {
    var randomNumber = Math.floor(Math.random()*error_msg.length);
    text = error_msg[randomNumber];
   document.getElementById("demo").innerHTML = text;
  }
}

function myFunction2() {
  var x, text;

  x = document.getElementById("answer").value;

  if (x==158) {
    // document.getElementById("demo").innerHTML = text;
   location.href = "http://vikastmz.github.io/quiz/stage_8837483.html";
  } else {
    var randomNumber = Math.floor(Math.random()*error_msg.length);
    text = error_msg[randomNumber];
   document.getElementById("demo").innerHTML = text;
  }
}

function myFunction3() {
  var x, text;

  x = document.getElementById("answer").value;

  if (x==40) {
    // document.getElementById("demo").innerHTML = text;
   location.href = "http://vikastmz.github.io/quiz/stage_272482.html";
  } else {
    var randomNumber = Math.floor(Math.random()*error_msg.length);
    text = error_msg[randomNumber];
   document.getElementById("demo").innerHTML = text;
  }
}

function myFunction4() {
  var x, text;

  x = document.getElementById("answer").value;
  location.href = "http://vikastmz.github.io/quiz/final_007.html";
}

function myFunction5() {
  var x, text;

  x = document.getElementById("answer").value;
  location.href = "http://vikastmz.github.io/quiz/.html";
}

var stickyadstatus = "";
function fix_stickyad() {
  document.getElementById("stickypos").style.position = "sticky";
  var elem = document.getElementById("stickyadcontainer");
  if (!elem) {return false;}
  if (document.getElementById("skyscraper")) {
    var skyWidth = Number(w3_getStyleValue(document.getElementById("skyscraper"), "width").replace("px", ""));  
    }
  else {
    var skyWidth = Number(w3_getStyleValue(document.getElementById("right"), "width").replace("px", ""));  
  }
  elem.style.width = skyWidth + "px";
  if (window.innerWidth <= 992) {
    elem.style.position = "";
    elem.style.top = stickypos + "px";
    return false;
  }
  var stickypos = document.getElementById("stickypos").offsetTop;
  var docTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  var adHeight = Number(w3_getStyleValue(elem, "height").replace("px", ""));
  if (stickyadstatus == "") {
    if ((stickypos - docTop) < 60) {
      elem.style.position = "fixed";
      elem.style.top = "60px";
      stickyadstatus = "sticky";
      document.getElementById("stickypos").style.position = "sticky";

    }
  } else {
    if ((docTop + 60) - stickypos < 0) {  
      elem.style.position = "";
      elem.style.top = stickypos + "px";
      stickyadstatus = "";
      document.getElementById("stickypos").style.position = "static";
    }
  }
  if (stickyadstatus == "sticky") {
    if ((docTop + adHeight + 60) > document.getElementById("footer").offsetTop) {
      elem.style.position = "absolute";
      elem.style.top = (document.getElementById("footer").offsetTop - adHeight) + "px";
      document.getElementById("stickypos").style.position = "static";
    } else {
        elem.style.position = "fixed";
        elem.style.top = "60px";
        stickyadstatus = "sticky";
        document.getElementById("stickypos").style.position = "sticky";
    }
  }
}
function w3_getStyleValue(elmnt,style) {
  if (window.getComputedStyle) {
    return window.getComputedStyle(elmnt,null).getPropertyValue(style);
  } else {
    return elmnt.currentStyle[style];
  }
}

