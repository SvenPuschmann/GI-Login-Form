!function(){"use strict";function t(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function e(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function i(t,i,n){return i&&e(t.prototype,i),n&&e(t,n),Object.defineProperty(t,"prototype",{writable:!1}),t}function n(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}function r(t,e){return function(t,e){if(e.get)return e.get.call(t);return e.value}(t,o(t,e,"get"))}function a(t,e,i){return function(t,e,i){if(e.set)e.set.call(t,i);else{if(!e.writable)throw new TypeError("attempted to set read only private field");e.value=i}}(t,o(t,e,"set"),i),i}function o(t,e,i){if(!e.has(t))throw new TypeError("attempted to "+i+" private field on non-instance");return e.get(t)}function l(t,e,i){if(!e.has(t))throw new TypeError("attempted to get private field on non-instance");return i}function u(t,e){if(e.has(t))throw new TypeError("Cannot initialize the same private elements twice on an object")}function s(t,e){u(t,e),e.add(t)}var c=function(){function e(){t(this,e)}return i(e,null,[{key:"hideElement",value:function(t){null!==t&&(t.style.display="none")}},{key:"showElement",value:function(t){null!==t&&(t.style.display="block")}}]),e}(),d=new WeakMap,h=new WeakSet,f=new WeakSet,w=new WeakSet,p=new WeakSet,m=new WeakSet,v=new WeakSet,b=new WeakSet,y=new WeakSet,S=new WeakSet,k=new WeakSet,g=new WeakSet,q=new WeakSet,W=new WeakSet,A=new WeakSet,E=new WeakSet,_=new WeakSet,T=new WeakSet,j=new WeakSet,C=i((function e(i){var o,c,C;t(this,e),s(this,j),s(this,T),s(this,_),s(this,E),s(this,A),s(this,W),s(this,q),s(this,g),s(this,k),s(this,S),s(this,y),s(this,b),s(this,v),s(this,m),s(this,p),s(this,w),s(this,f),s(this,h),n(this,"use strict",void 0),C={writable:!0,value:void 0},u(o=this,c=d),c.set(o,C),n(this,"initialize",(function(){var t=this;l(t,f,M).call(t),l(t,h,z).call(t)})),a(this,d,i),r(this,d).powermailConditions=this}));function z(){var t=this;l(this,m,x).call(this).forEach((function(e){e.addEventListener("change",(function(e){l(t,f,M).call(t)}))}))}function M(){var t=this;l(t,p,P).call(t),fetch(l(this,v,D).call(this),{body:new FormData(r(this,d)),method:"post"}).then((function(t){return t.json()})).then((function(e){e.loops>99?console.log("Too much loops reached by parsing conditions and rules. Check for conflicting conditions."):l(t,w,O).call(t,e)})).catch((function(t){console.log(t)}))}function O(t){if(void 0!==t.todo)for(var e in t.todo)for(var i in t.todo[e])for(var n in"hide"===t.todo[e][i]["#action"]&&l(this,k,G).call(this,l(this,T,R).call(this,i)),"un_hide"===t.todo[e][i]["#action"]&&l(this,S,B).call(this,l(this,T,R).call(this,i)),t.todo[e][i])"hide"===t.todo[e][i][n]["#action"]&&l(this,y,L).call(this,n),"un_hide"===t.todo[e][i][n]["#action"]&&l(this,b,F).call(this,n)}function P(){r(this,d).querySelectorAll('[disabled="disabled"]').forEach((function(t){t.removeAttribute("disabled")}))}function x(){return r(this,d).querySelectorAll('input:not([data-powermail-validation="disabled"]):not([type="hidden"]):not([type="submit"]), textarea:not([data-powermail-validation="disabled"]), select:not([data-powermail-validation="disabled"])')}function D(){var t=document.querySelector("[data-condition-uri]");return null===t&&console.log("Tag with data-condition-uri not found. Maybe TypoScript was not included."),t.getAttribute("data-condition-uri")}function F(t){var e=l(this,E,N).call(this,t);null!==e&&c.showElement(e);var i=l(this,_,Q).call(this,t);null!==i&&(i.removeAttribute("disabled"),l(this,q,I).call(this,i))}function L(t){var e=l(this,E,N).call(this,t);null!==e&&c.hideElement(e);var i=l(this,_,Q).call(this,t);null!==i&&(i.setAttribute("disabled","disabled"),l(this,g,H).call(this,i))}function B(t){c.showElement(t)}function G(t){c.hideElement(t)}function H(t){(t.hasAttribute("required")||t.hasAttribute("data-powermail-required"))&&(t.removeAttribute("required"),t.removeAttribute("data-powermail-required"),t.setAttribute("data-powermailcond-required","required"))}function I(t){"required"===t.getAttribute("data-powermailcond-required")&&(l(this,A,K).call(this)||l(this,W,J).call(this))&&t.setAttribute("required","required"),t.removeAttribute("data-powermailcond-required")}function J(){return"data-powermail-validate"===r(this,d).getAttribute("data-powermail-validate")}function K(){return"html5"===r(this,d).getAttribute("data-validate")}function N(t){var e=l(this,j,U).call(this,t);if(null!==e)return e;var i=l(this,_,Q).call(this,t);if(null!==i){var n=i.closest(".powermail_fieldwrap");if(null!==n)return n}return console.log('Error: Could not find field by fieldMarker "'+t+'"'),null}function Q(t){var e="tx_powermail_pi1[field]["+t+"]";return r(this,d).querySelector('[name="'+e+'"]:not([type="hidden"])')||r(this,d).querySelector('[name="'+e+'[]"]')}function R(t){return r(this,d).querySelector(".powermail_fieldset_"+t)}function U(t){return r(this,d).querySelector(".powermail_fieldwrap_"+t)}document.querySelectorAll(".powermail_form").forEach((function(t){new C(t).initialize()}))}();