var error_msg=["Try again Shreya","Coommeee onnn Shreya, Wrong Answer!","Give up Shreya","Close ............................................................................ just kidding"];function arrayMin(t){if(0===t.length)return 1/0;for(var e=t[0],n=1,o=t.length;n<o;++n)t[n]<e&&(e=t[n]);return e}function myFunction3(){var t;if(40==document.getElementById("answer").value)location.href="http://vikastmz.github.io/quiz/stage_272482.html";else{var e=Math.floor(Math.random()*error_msg.length);t=error_msg[e],document.getElementById("demo").innerHTML=t}}function arrayMax(t){if(0===t.length)return-1/0;for(var e=t[0],n=1,o=t.length;n<o;++n)t[n]>e&&(e=t[n]);return e}function myFunction(){var t;if(113==document.getElementById("answer").value)location.href="http://vikastmz.github.io/quiz/80085.html";else{var e=Math.floor(Math.random()*error_msg.length);t=error_msg[e],document.getElementById("demo").innerHTML=t}}function myFunction2(){var t;if(158==document.getElementById("answer").value)location.href="http://vikastmz.github.io/quiz/stage_8837483.html";else{var e=Math.floor(Math.random()*error_msg.length);t=error_msg[e],document.getElementById("demo").innerHTML=t}}function myFunction4(){document.getElementById("answer").value,location.href="http://vikastmz.github.io/quiz/final_007.html"}void 0===Number.EPSILON&&(Number.EPSILON=Math.pow(2,-52)),void 0===Number.isInteger&&(Number.isInteger=function(t){return"number"==typeof t&&isFinite(t)&&Math.floor(t)===t}),void 0===Math.sign&&(Math.sign=function(t){return t<0?-1:t>0?1:+t}),"name"in Function.prototype==!1&&Object.defineProperty(Function.prototype,"name",{get:function(){return this.toString().match(/^\s*function\s*([^\(\s]*)/)[1]}}),void 0===Object.assign&&(Object.assign=function(t){"use strict";if(void 0===t||null===t)throw new TypeError("Cannot convert undefined or null to object");for(var e=Object(t),n=1;n<arguments.length;n++){var o=arguments[n];if(void 0!==o&&null!==o)for(var i in o)Object.prototype.hasOwnProperty.call(o,i)&&(e[i]=o[i])}return e});var stickyadstatus="";function fix_stickyad(){document.getElementById("stickypos").style.position="sticky";var t=document.getElementById("stickyadcontainer");if(!t)return!1;if(document.getElementById("skyscraper"))var e=Number(w3_getStyleValue(document.getElementById("skyscraper"),"width").replace("px",""));else e=Number(w3_getStyleValue(document.getElementById("right"),"width").replace("px",""));if(t.style.width=e+"px",window.innerWidth<=992)return t.style.position="",t.style.top=n+"px",!1;var n=document.getElementById("stickypos").offsetTop,o=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop,i=Number(w3_getStyleValue(t,"height").replace("px",""));""==stickyadstatus?n-o<60&&(t.style.position="fixed",t.style.top="60px",stickyadstatus="sticky",document.getElementById("stickypos").style.position="sticky"):o+60-n<0&&(t.style.position="",t.style.top=n+"px",stickyadstatus="",document.getElementById("stickypos").style.position="static"),"sticky"==stickyadstatus&&(o+i+60>document.getElementById("footer").offsetTop?(t.style.position="absolute",t.style.top=document.getElementById("footer").offsetTop-i+"px",document.getElementById("stickypos").style.position="static"):(t.style.position="fixed",t.style.top="60px",stickyadstatus="sticky",document.getElementById("stickypos").style.position="sticky"))}function myFunction5(){document.getElementById("answer").value,location.href="http://vikastmz.github.io/quiz/.html"}function w3_getStyleValue(t,e){return window.getComputedStyle?window.getComputedStyle(t,null).getPropertyValue(e):t.currentStyle[e]}