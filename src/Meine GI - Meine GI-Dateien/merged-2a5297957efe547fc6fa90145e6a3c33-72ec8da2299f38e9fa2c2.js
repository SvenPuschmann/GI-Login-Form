
try {
    var omCookieGroups = JSON.parse(document.getElementById('om-cookie-consent').innerHTML);
    var omGtmEvents = [];
}
catch(err) {
    console.log('OM Cookie Manager: No Cookie Groups found! Maybe you have forgot to set the page id inside the constants of the extension')
}


document.addEventListener('DOMContentLoaded', function(){
    var panelButtons = document.querySelectorAll('[data-omcookie-panel-save]');
    var openButtons = document.querySelectorAll('[data-omcookie-panel-show]');
    var i;
    var omCookiePanel = document.querySelectorAll('[data-omcookie-panel]')[0];
    if(omCookiePanel === undefined) return;
    var openCookiePanel = true;

    //Enable stuff by Cookie
    var cookieConsentData = omCookieUtility.getCookie('omCookieConsent');
    if(cookieConsentData !== null && cookieConsentData.length > 0){
        //dont open the panel if we have the cookie
        openCookiePanel = false;
        var checkboxes = document.querySelectorAll('[data-omcookie-panel-grp]');
        var cookieConsentGrps = cookieConsentData.split(',');
        var cookieConsentActiveGrps = '';

        for(i = 0; i < cookieConsentGrps.length; i++){
            if(cookieConsentGrps[i] !== 'dismiss'){
                var grpSettings = cookieConsentGrps[i].split('.');
                if(parseInt(grpSettings[1]) === 1){
                    omCookieEnableCookieGrp(grpSettings[0]);
                    cookieConsentActiveGrps += grpSettings[0] + ',';
                }
            }
        }
        for(i = 0; i < checkboxes.length; i++){
            if(cookieConsentActiveGrps.indexOf(checkboxes[i].value)  !== -1){
                checkboxes[i].checked = true;
            }
            //check if we have a new group
            if(cookieConsentData.indexOf(checkboxes[i].value) === -1){
                openCookiePanel = true;
            }
        }
        //push stored events(sored by omCookieEnableCookieGrp) to gtm. We push this last so we are sure that gtm is loaded
        pushGtmEvents(omGtmEvents);
        omTriggerPanelEvent(['cookieconsentscriptsloaded']);
    }
    if(openCookiePanel === true){
        //timeout, so the user can see the page before he get the nice cookie panel
        setTimeout(function () {
            omCookiePanel.classList.toggle('active');
        },1000);
    }

    //check for button click
    for (i = 0; i < panelButtons.length; i++) {
        panelButtons[i].addEventListener('click', omCookieSaveAction, false);
    }
    for (i = 0; i < openButtons.length; i++) {
        openButtons[i].addEventListener('click', function () {
            omCookiePanel.classList.toggle('active');
        }, false);
    }

});

//activates the groups
var omCookieSaveAction = function() {
    action = this.getAttribute('data-omcookie-panel-save');
    var checkboxes = document.querySelectorAll('[data-omcookie-panel-grp]');
    var i;
    //check if we have a cookie
    var cookie = omCookieUtility.getCookie('omCookieConsent');
    if(cookie === null || cookie.length <= 0){
        //set cookie to empty string when no cookie data was found
        cookie = '';
    }else{
        //reset all values inside the cookie which are present in the actual panel
        for (i = 0; i < checkboxes.length; i++) {
            cookie = cookie.replace(new RegExp(checkboxes[i].value + '\\S{3}'),'');
        }
    }
    //save the group id (group-x) and the made choice (.0 for group denied and .1 for group accepted)
    switch (action) {
        case 'all':
            for (i = 0; i < checkboxes.length; i++) {
                omCookieEnableCookieGrp(checkboxes[i].value);
                cookie += checkboxes[i].value + '.1,';
                checkboxes[i].checked = true;
            }
        break;
        case 'save':
            for (i = 0; i < checkboxes.length; i++) {
                if(checkboxes[i].checked === true){
                    omCookieEnableCookieGrp(checkboxes[i].value);
                    cookie += checkboxes[i].value + '.1,';
                }else{
                    cookie += checkboxes[i].value + '.0,';
                }
            }
        break;
        case 'min':
            for (i = 0; i < checkboxes.length; i++) {
                if(checkboxes[i].getAttribute('data-omcookie-panel-essential') !== null){
                    omCookieEnableCookieGrp(checkboxes[i].value);
                    cookie += checkboxes[i].value + '.1,';
                }else{
                    cookie += checkboxes[i].value + '.0,';
                    checkboxes[i].checked = false;
                }
            }
        break;
    }
    //replace dismiss to the end of the cookie
    cookie = cookie.replace('dismiss','');
    cookie += 'dismiss';
    //cookie = cookie.slice(0, -1);
    omCookieUtility.setCookie('omCookieConsent',cookie,364);
    //push stored events to gtm. We push this last so we are sure that gtm is loaded
    pushGtmEvents(omGtmEvents);
    omTriggerPanelEvent(['cookieconsentsave','cookieconsentscriptsloaded']);

    setTimeout(function () {
        document.querySelectorAll('[data-omcookie-panel]')[0].classList.toggle('active');
    },350)

};

var omTriggerPanelEvent = function(events){
  events.forEach(function (event) {
      var eventObj = new CustomEvent(event, {bubbles: true});
      document.querySelectorAll('[data-omcookie-panel]')[0].dispatchEvent(eventObj);
  })
};

var pushGtmEvents = function (events) {
    window.dataLayer = window.dataLayer || [];
    events.forEach(function (event) {
        window.dataLayer.push({
            'event': event,
        });
    });
};
var omCookieEnableCookieGrp = function (groupKey){
    if(omCookieGroups[groupKey] !== undefined){
        for (var key in omCookieGroups[groupKey]) {
            // skip loop if the property is from prototype
            if (!omCookieGroups[groupKey].hasOwnProperty(key)) continue;
            var obj = omCookieGroups[groupKey][key];
            //save gtm event for pushing
            if(key === 'gtm'){
                if(omCookieGroups[groupKey][key]){
                    omGtmEvents.push(omCookieGroups[groupKey][key]);
                }
                continue;
            }
            //set the cookie html
            for (var prop in obj) {
                // skip loop if the property is from prototype
                if (!obj.hasOwnProperty(prop)) continue;

                if(Array.isArray(obj[prop])){
                    var content = '';
                    //get the html content
                    obj[prop].forEach(function (htmlContent) {
                        content += htmlContent
                    });
                    var range = document.createRange();
                    if(prop === 'header'){
                        // add the html to header
                        range.selectNode(document.getElementsByTagName('head')[0]);
                        var documentFragHead = range.createContextualFragment(content);
                        document.getElementsByTagName('head')[0].appendChild(documentFragHead);
                    }else{
                        //add the html to body
                        range.selectNode(document.getElementsByTagName('body')[0]);
                        var documentFragBody = range.createContextualFragment(content);
                        document.getElementsByTagName('body')[0].appendChild(documentFragBody);
                    }
                }
            }
        }
        //remove the group so we don't set it again
        delete omCookieGroups[groupKey];
    }
};
var omCookieUtility = {
    getCookie: function(name) {
            var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
            return v ? v[2] : null;
        },
    setCookie: function(name, value, days) {
            var d = new Date;
            d.setTime(d.getTime() + 24*60*60*1000*days);
            document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString() + ";SameSite=Lax";
        },
    deleteCookie: function(name){ setCookie(name, '', -1); }
};

(function () {

    if ( typeof window.CustomEvent === "function" ) return false;

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    window.CustomEvent = CustomEvent;
})();


!function t(e,o,r){function n(a,i){if(!o[a]){if(!e[a]){var l="function"==typeof require&&require;if(!i&&l)return l(a,!0);if(s)return s(a,!0);var c=new Error("Cannot find module '"+a+"'");throw c.code="MODULE_NOT_FOUND",c}var h=o[a]={exports:{}};e[a][0].call(h.exports,(function(t){return n(e[a][1][t]||t)}),h,h.exports,t,e,o,r)}return o[a].exports}for(var s="function"==typeof require&&require,a=0;a<r.length;a++)n(r[a]);return n}({1:[function(t,e,o){"use strict";Object.defineProperty(o,"__esModule",{value:!0});var r=function(){function t(){}return t.prototype.verdictLength=function(t){var e=0,o="",r=t.length;switch(!0){case r>0&&r<5:o="3 points for length ("+r+")",e=3;break;case r>4&&r<8:o="6 points for length ("+r+")",e=6;break;case r>7&&r<16:o="12 points for length ("+r+")",e=12;break;case r>15:o="18 points for length ("+r+")",e=18}return{score:e,log:o}},t.prototype.verdictLetter=function(t){var e=0,o="",r=t.match(/[a-z]/),n=t.match(/[A-Z]/);return r?n?(e=7,o="7 points for letters are mixed"):(e=5,o="5 point for at least one lower case char"):n&&(e=5,o="5 points for at least one upper case char"),{score:e,log:o}},t.prototype.verdictNumbers=function(t){var e=0,o="",r=t.replace(/\D/gi,"");return r.length>1?(e=7,o="7 points for at least three numbers"):r.length>0&&(e=5,o="5 points for at least one number"),{score:e,log:o}},t.prototype.verdictSpecialChars=function(t){var e=0,o="",r=t.replace(/[\w\s]/gi,"");return r.length>1?(e=10,o="10 points for at least two special chars"):r.length>0&&(e=5,o="5 points for at least one special char"),{score:e,log:o}},t.prototype.verdictCombos=function(t,e,o){var r=0,n="";return 7===t&&e>0&&o>0?(r=6,n="6 combo points for letters, numbers and special characters"):t>0&&e>0&&o>0?(r=4,n="4 combo points for letters, numbers and special characters"):7===t&&e>0?(r=2,n="2 combo points for mixed case letters and numbers"):t>0&&e>0?(r=1,n="1 combo points for letters and numbers"):7===t&&(r=1,n="1 combo points for mixed case letters"),{score:r,log:n}},t.prototype.finalVerdict=function(t){return t<16?"very weak":t>15&&t<25?"weak":t>24&&t<35?"mediocre":t>34&&t<45?"strong":"stronger"},t.prototype.calculate=function(t){var e=this.verdictLength(t),o=this.verdictLetter(t),r=this.verdictNumbers(t),n=this.verdictSpecialChars(t),s=this.verdictCombos(o.score,r.score,n.score),a=e.score+o.score+r.score+n.score+s.score,i=[e.log,o.log,r.log,n.log,s.log,a+" points final score"].join("\n");return{score:a,verdict:this.finalVerdict(a),log:i}},t}();o.default=r},{}],2:[function(t,e,o){"use strict";Object.defineProperty(o,"__esModule",{value:!0});var r=t("./PasswordStrengthCalculator"),n=window.document,s=function(){function t(){this.loading=!1,this.ajaxRequest=null,this.barGraph=null,this.passwordStrengthCalculator=null,this.zone=null,this.zoneEmpty=null,this.zoneLoading=null,n.addEventListener("DOMContentLoaded",this.contentLoaded.bind(this))}return t.prototype.contentLoaded=function(){this.zone=n.getElementById("sfrZone"),this.zoneEmpty=n.getElementById("sfrZone_empty"),this.zoneLoading=n.getElementById("sfrZone_loading"),this.barGraph=n.getElementById("bargraph"),this.barGraph&&(this.barGraph.classList.add("show"),this.passwordStrengthCalculator=new r.default,this.isInternetExplorer()?this.loadInternetExplorerPolyfill():this.attachToElementById("sfrpassword","keyup",this.callTestPassword.bind(this))),this.attachToElementById("sfrCountry","change",this.countryChanged.bind(this)),this.attachToElementById("sfrCountry","keyup",this.countryChanged.bind(this)),this.attachToElementById("uploadButton","change",this.uploadFile.bind(this)),this.attachToElementById("removeImageButton","click",this.removeFile.bind(this))},t.prototype.showElement=function(t){t.classList.remove("d-none"),t.classList.add("d-block")},t.prototype.hideElement=function(t){t.classList.remove("d-block"),t.classList.add("d-none")},t.prototype.attachToElementById=function(t,e,o){var r=n.getElementById(t);this.attachToElement(r,e,o)},t.prototype.attachToElement=function(t,e,o){t&&t.addEventListener(e,o)},t.prototype.callTestPassword=function(t){var e=t.target,o=this.passwordStrengthCalculator.calculate(e.value);if("meter"===this.barGraph.tagName.toLowerCase())this.barGraph.value=o.score;else for(var r=this.barGraph,n=Math.min(Math.floor(o.score/3.4),10),s=(r.contentDocument||r.contentWindow.document).getElementsByClassName("blind"),a=0;a<s.length;a++){var i=s[a];a<n?this.hideElement(i):this.showElement(i)}},t.prototype.isInternetExplorer=function(){var t=navigator.userAgent;return t.indexOf("MSIE ")>-1||t.indexOf("Trident/")>-1},t.prototype.loadInternetExplorerPolyfill=function(){var t=this,e=n.getElementsByTagName("body").item(0),o=n.createElement("script");o.setAttribute("type","text/javascript"),o.setAttribute("src","https://unpkg.com/meter-polyfill/dist/meter-polyfill.min.js"),o.onload=function(){meterPolyfill(t.barGraph),t.attachToElementById("sfrpassword","keyup",t.callTestPassword)},e.appendChild(o)},t.prototype.countryChanged=function(t){if(("change"===t.type||"keyup"===t.type&&(40===t.keyCode||38===t.keyCode))&&!0!==this.loading&&this.zone){var e=t.target||t.srcElement,o=e.options[e.selectedIndex].value;this.loading=!0,this.zone.disabled=!0,this.hideElement(this.zoneEmpty),this.showElement(this.zoneLoading),this.ajaxRequest=new XMLHttpRequest,this.ajaxRequest.onload=this.xhrReadyOnLoad.bind(this),this.ajaxRequest.open("POST","index.php?ajax=sf_register"),this.ajaxRequest.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8"),this.ajaxRequest.send("tx_sfregister[action]=zones&tx_sfregister[parent]="+o)}},t.prototype.xhrReadyOnLoad=function(t){var e=t.target;if(4===e.readyState&&200===e.status){var o=JSON.parse(e.responseText);this.hideElement(this.zoneLoading),"error"===o.status||0===o.data.length?this.showElement(this.zoneEmpty):this.addZoneOptions(o.data)}this.loading=!1},t.prototype.addZoneOptions=function(t){for(var e=this;this.zone.length;)this.zone.removeChild(this.zone[0]);t.forEach((function(t,o){e.zone.options[o]=new Option(t.label,t.value)})),this.zone.disabled=!1},t.prototype.uploadFile=function(){var t=n.getElementById("uploadFile");t&&(t.value=this.value)},t.prototype.removeFile=function(){var t=n.getElementById("removeImage");t&&(t.value="1"),this.submitForm()},t.prototype.submitForm=function(){var t=n.getElementById("sfrForm");t&&t.submit()},t}();o.default=s},{"./PasswordStrengthCalculator":1}],3:[function(t,e,o){"use strict";Object.defineProperty(o,"__esModule",{value:!0});var r=new(t("./SfRegister").default);window.sfRegister_submitForm=function(){return new Promise((function(t,e){void 0===grecaptcha&&(alert("Recaptcha ist nicht definiert"),e()),document.getElementById("captcha").value=grecaptcha.getResponse(),r.submitForm(),t()}))}},{"./SfRegister":2}]},{},[3]);
//# sourceMappingURL=sf_register.js.map

// CustomEvent: No support for IE
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
(function () {

    if ( typeof window.CustomEvent === "function" ) return false;

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

$(document).on('submitted.powermail.form',function() {
    /**
     *  This is the core function from powermail form.js, if there is some kind of problem check
     *  original implantation changes
     */
    var addDatePicker = function() {
        if ($.fn.datetimepicker) {
            $('.powermail_date').each(function() {
                var $this = $(this);
                // stop javascript datepicker, if browser supports type="date" or "datetime-local" or "time"
                if ($this.prop('type') === 'date' || $this.prop('type') === 'datetime-local' || $this.prop('type') === 'time') {
                    if ($this.data('datepicker-force')) {
                        // rewrite input type
                        $this.prop('type', 'text');
                        $this.val($(this).data('date-value'));
                    } else {
                        // get date in format Y-m-d H:i for html5 date fields
                        if ($(this).data('date-value')) {
                            var prefillDate = getDatetimeForDateFields($(this).data('date-value'), $(this).data('datepicker-format'), $this.prop('type'));
                            if (prefillDate !== null) {
                                $(this).val(prefillDate);
                            }
                        }

                        // stop js datepicker
                        return;
                    }
                }

                var datepickerStatus = true;
                var timepickerStatus = true;
                if ($this.data('datepicker-settings') === 'date') {
                    timepickerStatus = false;
                } else if ($this.data('datepicker-settings') === 'time') {
                    datepickerStatus = false;
                }

                // create datepicker
                $this.datetimepicker({
                    format: $this.data('datepicker-format'),
                    timepicker: timepickerStatus,
                    datepicker: datepickerStatus,
                    lang: 'en',
                    i18n:{
                        en:{
                            months: $this.data('datepicker-months').split(','),
                            dayOfWeek: $this.data('datepicker-days').split(',')
                        }
                    }
                });
            });
        }
    };
    addDatePicker();
});


$(function() {
    $('.datepicker').datepicker({
        format: "dd.mm.yyyy",
        weekStart: 1,
        startDate: "now",
        language: "de",
        daysOfWeekHighlighted: "0,6",
        calendarWeeks: true,
        autoclose: true,
        todayHighlight: true
    });

    // close other mobile menu when expanded
    var $document = $(document),
        navMain = $(".navbar-toggler"),
        subnav = $("#subnav"),
        subnavDropdown = subnav.find('.dropdown'),
        stickyNavHeader = $('.wiro-header'),
        stickyNav = $('.wiro-headerSub.sticky-top');

    navMain.click(function() {
        $(".navbar-collapse.collapse.show").collapse('hide');
    });

    // add slideDown animation to Bootstrap dropdown when expanding
    subnavDropdown.on('show.bs.dropdown', function() {
        if (navMain.is(':visible')) {
            $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
        }
    });

    // add slideUp animation to Bootstrap dropdown when collapsing
    subnavDropdown.on('hide.bs.dropdown', function() {
        if (navMain.is(':visible')) {
            $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
        }
    });

    // Sticky navigation: maximal height to enable scrolling
    subnav
        .on('show.bs.collapse', function() {
            var viewport = window.innerHeight,
                padding = stickyNavHeader.height(),
                scrollTop = $document.scrollTop();

            stickyNav.css({
                maxHeight: viewport - Math.max(0, padding - scrollTop),
                overflowY: 'auto'
            });
        })
        .on('hidden.bs.collapse', function() {
            stickyNav.css({
                maxHeight: '',
                overflowY: ''
            });
        });

    // display the actions in the lightbox, without page reload
    // $document.on('submit', '#formEventRegist', function(event){
    //     event.preventDefault();
    //
    //     var $form = $( this ),
    //         url = $form.attr( 'action' );
    //
    //     $.ajax({
    //         url: url,
    //         data: $form.serialize(),
    //         type: "POST",
    //         success: function(data) {
    //             var event = new CustomEvent('formEventRegistSuccess');
    //             document.dispatchEvent(event);
    //             $('#contentRegistData').empty().append(data);
    //         }
    //     });
    // });

    $('[data-toggle=popover]').popover();

    document.addEventListener('eventCloseLightbox', function () {
        if($('body #lightboxModal').length > 0){
            var modal = $('body #lightboxModal');
            modal.modal('hide');
        }
    });

    $document.on('click', '[data-toggle="lightbox"], .lightbox, a.lightbox2', function(event) {
        event.preventDefault();
        addModal();
        var modal = $('body #lightboxModal');
        modal.find('.modal-body').first().html('<div class="sk-folding-cube mb-5"><div class="sk-cube1 sk-cube"></div><div class="sk-cube2 sk-cube"></div><div class="sk-cube4 sk-cube"></div><div class="sk-cube3 sk-cube"></div></div>\n');
        if($(this).attr('title')){
            modal.find('.modal-header').html('<h5 class="modal-title">' +$(this).attr('title')+ '</h5> ' +
                '<button type="button" class="close" data-dismiss="modal">&times;</button>');
        }else{
            modal.find('.modal-header').html('<button type="button" class="close" data-dismiss="modal">&times;</button>');
        }
        modal.modal('show');
        var url = $(this).attr('href');
        if (url){
            //image show directly
            if (isImageURL(url) === true){
                var img = $(document.createElement('img'));
                img.attr('src',url);
                img.addClass('img-fluid');
                modal.find('.modal-body').first().html('');
                modal.find('.modal-body').first().append(img);
            } else {
                //if the url is no image we try to fetch it
                $.ajax({
                    url: $(this).attr('href'),
                    success: function(response){
                        // Add response in Modal body
                        if($(response).find('#page-content').length > 0){
                            modal.find('.modal-body').first().html($(response).find('#page-content'));
                        }else{
                            modal.find('.modal-body').first().html($(response));
                        }
                    }
                });
            }
        }
        //special meine gi loadings
        if($(this).attr('data-content-id')) {
            var contentId = $(this).attr('data-content-id');
            //disable extra pages
            $("#" + contentId).find('.lightbox-page').addClass('d-none');
            $("#" + contentId).find('.lightbox-page').first().removeClass('d-none');

            var content = $("#" + contentId).html();
            modal.find('.modal-body').first().html(content);
            $("#" + contentId).empty();
            initReloadContent();
        }
    });

    function isImageURL(url) {
        return(url.match(/\.(jpeg|jpg|gif|png|svg)$/) != null);
    }

    function addModal(){
        if($('body #lightboxModal').length < 1){
            $document.find('body').append('<div class="modal" id="lightboxModal">\n' +
                '  <div class="modal-dialog modal-xl">\n' +
                '    <div class="modal-content">\n' +
                '\n' +
                '      <!-- Modal Header -->\n' +
                '      <div class="modal-header">\n' +
                '        \n' +
                '        <button type="button" class="close" data-dismiss="modal">&times;</button>\n' +
                '      </div>\n' +
                '\n' +
                '      <!-- Modal body -->\n' +
                '      <div class="modal-body">\n' +
                '        Modal body..\n' +
                '      </div>\n' +
                '    </div>\n' +
                '  </div>\n' +
                '</div>');
        }
    }

    /**
     *  Resize-Event from ekkoLightbox
     */
    $(window).on('resize.ekkoLightbox', function(e) {
        ekkoLightboxSetImgHeight();
    });

    /**
     * Set max height of image
     */
    function ekkoLightboxSetImgHeight() {
        var $height = $('.modal-body').height() - 35;
        $('.ekko-lightbox-container').find('.img-fluid').css('max-height', $height + 'px');
    };

    /**
     * Add a focus class to the input/form group
     */
    $document.on('focus', ':input:not([readonly],[disabled])', function() {
        $(this).closest('.input-group, .form-group, label.custom-control').addClass('focus');
    });

    /**
     * Remove the focus class to the input/form group
     */
    $document.on('blur', ':input:not([readonly],[disabled])', function() {
        $(this).closest('.input-group, .form-group, label.custom-control').removeClass('focus');
    });

    /**
     * Auto-resize bootstrap text-area
     */
    $document.on('input', 'textarea.form-control', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    }).find('textarea.form-control').css('overflowY', 'hidden');

    /**
     * Show the filename in an upload input
     */
    $document.on('change', '.custom-file input[type=file]', function() {
        var path = this.value || '',
            filename = path.split(/(\\|\/)/g).pop(),
            control = $(this).closest('.custom-file').find('.custom-file-control');
        if (path && filename) {
            control
                .text(filename)
                .addClass('filled');
        } else {
            control
                .text('')
                .removeClass('filled');
        }
    });

    /**
     * Allows pagination in a lightbox
     *
     * IDs and classes:
     * - data-content-id    (ID) ID of the entire content
     * - data-page          (ID) Which page should be displayed
     * - lightbox-input     (Class) Where are the checkboxes
     * - lightbox-output    (Class) Output of the checked checkboxes
     * - lightbox-page      (Class) a page
     */
    $document.on('click', '.lightbox-paginate', function(event) {
        var contentId = '#' + $(this).attr('data-content-id');
        var page = '#' + $(this).attr('data-page');

        var input = $(contentId).find('.lightbox-input');
        var output = $(contentId).find('.lightbox-output');
        if (input) {
            $(output).empty();
            $(input).find('input:checkbox').each(function (index) {
                if ($(this).prop('checked')) {
                    var caption = $(this).siblings('.custom-control-description').text();
                    var value = $(this).val();
                    $(output).append(
                        '<label class="custom-control custom-checkbox label-with-icon"><i class="icon icon-check"></i><span class="custom-control-description">' + caption + '</span></label>'
                    );

                }
            });
        }

        $('.lightbox-page').addClass('d-none');
        $(contentId).find(page).removeClass('d-none');
    });

    function initReloadContent() {
        $('.form-reload-content').each(function () {
            var form = $(this),
                id = form.attr('id');

            // Submit erst freischalten, wenn Änderungen vorhanden sind.
            form.find('.lightbox-paginate[type=button]').prop('disabled', true);
            var origForm = form.serialize();
            $(form).on('change input', function() {
                form.find('.lightbox-paginate[type=button]').prop('disabled', form.serialize() === origForm);
            });

            // Submit via ajax. success -> Content der Seite austauschen
            $(form).submit(function (event) {
                event.preventDefault();

                var ajaxForm = $(this),
                    loadingContent = '<div class="sk-folding-cube"><div class="sk-cube1 sk-cube"></div><div class="sk-cube2 sk-cube"></div><div class="sk-cube4 sk-cube"></div><div class="sk-cube3 sk-cube"></div></div>';

                if (loadingContent) {
                    loadingContent = $(loadingContent);
                    loadingContent.css({
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        zIndex: 10
                    });
                    var reloadId = '#' + $(ajaxForm).attr('data-reload');
                    $(reloadId).append(loadingContent);
                    $(reloadId).addClass('gi-members-paginate--loading');
                }

                $.ajax({
                    url: ajaxForm.attr('action'),
                    type: ajaxForm.attr('method'),
                    data: ajaxForm.serialize(),

                    beforeSend: function( xhr ) {
                        var event = new CustomEvent('eventCloseLightbox');
                        document.dispatchEvent(event);
                    },

                    success: function (responseText) {
                        var content = $('<div>').append($.parseHTML(responseText));
                        var reloadId = '#' + $(ajaxForm).attr('data-reload');
                        $(reloadId).html(content.find(reloadId).html());
                        $(reloadId).removeClass('gi-members-paginate--loading');
                    },

                    error: function(jqXHR, textStatus, errorThrown) {
                        //
                    }

                });
                return false;
            });
        });
    }
    initReloadContent();

    // Veranstaltungen - Loadingspinner anzeigen wenn die Anmeldung erfolgte
    // $(document).on('submit','#formEventRegist',function(){
    //     var loadingContent = '<div id="regist-loading" class="gi-members"><div class="gi-members-box--loading"></div></div>';
    //     if (loadingContent) {
    //         loadingContent = $(loadingContent);
    //         loadingContent.css({
    //             position: 'absolute',
    //             top: 0,
    //             right: 0,
    //             bottom: 0,
    //             left: 0,
    //             zIndex: 10
    //         });
    //         $('#contentRegistData').append(loadingContent);
    //     }
    //     var loadingContentCube = '<div id="regist-loading-cube"><div class="sk-folding-cube"><div class="sk-cube1 sk-cube"></div><div class="sk-cube2 sk-cube"></div><div class="sk-cube4 sk-cube"></div><div class="sk-cube3 sk-cube"></div></div></div>'
    //     if (loadingContentCube) {
    //         loadingContentCube = $(loadingContentCube);
    //         loadingContentCube.css({
    //             position: 'absolute',
    //             top: 0,
    //             right: 0,
    //             bottom: 0,
    //             left: 0,
    //             zIndex: 10
    //         });
    //         $('.modal-content').append(loadingContentCube);
    //     }
    //     event.preventDefault();
    // });
    // document.addEventListener('formEventRegistSuccess', function () {
    //     $('#regist-loading').remove();
    //     $('.modal-content').find('#regist-loading-cube').remove();
    // });

    $('button.scroll-to--js').on('click', function (e) {
        var $scrollTo = $("a[name='"+ $(this).attr("data-scrollto") +"']");
        $('html,body').animate({
            scrollTop: $scrollTo.offset().top
        }, 700);
    });

});

var isotopFilter = function (){
    if($(this).hasClass('hidden')){
        return false;
    }
    return true;
};

var $grid = $('.teaser-container--filter .grid').isotope({
    itemSelector: '.grid-item',
    layoutMode: 'fitRows',
    percentPosition: true,
    fitRows: {
        gutter: '.gutter-sizer'
    },
    filter:isotopFilter,
});

$('.teaser-container--filter').on('click','.tags button', function (){
    $(this).toggleClass('active');
    $container = $(this).closest('.teaser-container--filter').first();

    if($container.length > 0){
        filterTeaserContainerEntries($container);
    }
    $grid.isotope({filter:isotopFilter});
});


// $('.teaser-container--filter #teaser-container-quicksearch').keyup(function() {
//     var input = $(this);
//     if(input.val().length >= 3){
//         $container = input.closest('.teaser-container--filter').first();
//         filterTeaserContainerEntries($container);
//         $grid.isotope({filter:isotopFilter});
//     }
// });

$('.teaser-container--filter #teaser-container-quicksearch').keyup(delay(function(e){
    var input = $(this);
    if(input.val().length >= 3 || input.val() === ''){
        $container = input.closest('.teaser-container--filter').first();
        filterTeaserContainerEntries($container);
        $grid.isotope({filter:isotopFilter});
    }
},500));

function delay(callback, ms) {
    var timer = 0;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}

function filterTeaserContainerEntries($containerElement){
    var actTags = $containerElement.find('.tags button.active');
    var quicksearch = $containerElement.find('#teaser-container-quicksearch').val();
    var filterTextActive = 0;
    if(quicksearch.length >= 3){
        filterTextActive = 1;
        var quicksearchReg = new RegExp( quicksearch, 'gi' );
    }
    var filterTagActive = 0;
    if ( actTags.length > 0){
        filterTagActive = 1;
    }

    var teasers = $containerElement.find('.teaser-container__child');

    teasers.each(function (){
       var tagString = $(this).find('.frame-type-gibase_teaser').first().data('teaser-filter-tags');
       var tagArray = tagString.split(',');
       var valid = 1;

       if(filterTextActive === 1){
           if($(this).text().match(quicksearchReg) === null){
               valid = 0;
           }
       }

       if(filterTagActive === 1){
           actTags.each(function (){
              var tag = $(this).text().trim();
              if (tagArray.indexOf(tag) === -1) {
                  valid = 0;
              }
           });
       }

       if(valid === 1){
           $(this).removeClass('hidden');
       } else {
           $(this).addClass('hidden');
       }
    });
}
$('.frame-type-gibase-lazy-consent-container .consent-controls button').on('click', function (){
   var consentContainer = $(this).closest('.frame-type-gibase-lazy-consent-container').first();
   var consentType = $(this).data('consent');
   consentContainer.find('.consent-child').each(function (){
       var childContainer = $(this);
       var url = childContainer.data('url');
       childContainer.find('.consent-loader').removeClass('d-none');
       if(url){
           $.ajax({
               url: url,
           }).done(function (response){
               $(response).insertAfter(childContainer);
               childContainer.remove();
           }).fail(function (){
               childContainer.find('.consent-loader').addClass('d-none');
           });
       }
   });

    consentContainer.find('.consent-container__disclaimer').addClass('d-none');

   if(consentType === 'perma'){
       consentContainer.find('.consent-button--revoke').removeClass('d-none');
       var consentStorage = window.localStorage.getItem('lazy-consent-container');
       var consentId = consentContainer.find('.consent-container').first().attr('id');
       var store = [];
       if(consentStorage){
           store = JSON.parse(consentStorage);
           if(store.indexOf(consentId) === -1){
               store.push(consentId);
               store = JSON.stringify(store);
               window.localStorage.setItem('lazy-consent-container',store);
           }
       } else {
           store = JSON.stringify([consentId]);
           window.localStorage.setItem('lazy-consent-container',store);
       }
   }
});
//load perma consent
if($('.frame-type-gibase-lazy-consent-container').length > 0){
    var consentStorage = window.localStorage.getItem('lazy-consent-container');
    if(consentStorage) {
        store = JSON.parse(consentStorage);
        store.forEach(function (value){
            $('#' + value).find('button[data-consent="once"]').first().trigger('click');
            $('#' + value).find('.consent-button--revoke').removeClass('d-none');
        });
    }
}

$(document).on('click','.frame-type-gibase-lazy-consent-container .consent-button--revoke', function (){
    var consentId = $(this).closest('.consent-container').first().attr('id');
    var msg = $(this).data('msg');
    var consentStorage = window.localStorage.getItem('lazy-consent-container');
    if(consentStorage){
        store = JSON.parse(consentStorage);
        store = store.filter(function(e) {
            return e !== consentId;
        });
        store = JSON.stringify(store);
        window.localStorage.setItem('lazy-consent-container',store);
    }
    $('<div>' + msg + '</div>').insertAfter($(this));
    $(this).addClass('d-none');
});

$('.frame-type-gibase-lazy-consent-container').on('submit','.form-inline',function (e){
    e.preventDefault();
    var url = $(this).data('ajax');
    var in2contactContainer = $(this).closest('.tx-in2contact');
    in2contactContainer.find(' > .row').remove();
    in2contactContainer.find('.table-responsive').remove();
     var loader = '<div class="loader"> <div class="sk-folding-cube"><div class="sk-cube1 sk-cube"></div><div class="sk-cube2 sk-cube"></div><div class="sk-cube4 sk-cube"></div><div class="sk-cube3 sk-cube"></div></div></div>';
    in2contactContainer.append(loader);
    $.ajax({
        type:'POST',
        url: url,
        data: $(this).serialize()
    }).done(function (response){
        in2contactContainer.find('.loader').remove();
        if ($(response).find(' > .row').length > 0){
            in2contactContainer.append($(response).find(' > .row'));
        } else {
            in2contactContainer.append($(response).find('.table-responsive'));
        }
    }).fail(function (){
        in2contactContainer.find('.loader').remove();
        in2contactContainer.append('<div class="row"><div class="col-12">Loading Error</div></div>');
    });
});

//anti spam sf_event_mgt
if($('#js-cr-challenge').length > 0){
    /**
     * Required JavaScript for sf_event_mgt challenge/response spam detection
     */
    document.addEventListener('DOMContentLoaded', function () {
        var crElement = document.getElementById('js-cr-challenge');
        var challenge = crElement.getAttribute('data-challenge');

        // ROT13 the challenge - source: https://stackoverflow.com/a/617685/1744743
        challenge = challenge.replace(/[a-zA-Z]/g, function (c) {
            return String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
        });

        crElement.value = challenge;
    });
}

//download counter
if($('.ce-uploads a').length > 0){
    $('.ce-uploads a').on('click',function (e){
        var du = $(this).data('dcount');
        if(du){
            $.ajax('/ax-dcount',{
                data:{du:du}
            });
        }
    });
}

//eol-payment-form and donation selector interaction
$('#eol_payment_form').on('keyup change','#amount',function (){
    let form = $(this).parents('.eol-payment');
    let donationSelector = form.find('.donation-selector');
    let amount = $(this).val();
    if(donationSelector.length > 0){
        donationSelector.find('input').each(function(){
            $(this).prop( 'checked', false );
           if ($(this).val() === amount){
               $(this).prop( 'checked', true );
           }
        });
        if(donationSelector.find('input:checked').length < 1){
            donationSelector.find('input[value="free"]').prop('checked', true);
        }
    }
});

var donationAmountTimeout;
$('.eol-payment').on('click','.donation-options__option',function (){
    clearTimeout(donationAmountTimeout);
    let selection = $(this).find('input').first().val();
    let input = $(this).closest('.eol-payment').find('#amount');
    input.removeClass('blink');
    input.val(selection);
    $('html,body').animate({
        scrollTop: $('#eol_payment_form').offset().top
    }, 700,function (){
        input.addClass('blink');
    });
    donationAmountTimeout = setTimeout(function (){
        input.removeClass('blink');
    },2300);
});

if($('.eol-payment-form .donation-selector').length > 0){
    let input = $('.eol-payment-form').find('#amount');
    setTimeout(function (){
        input.addClass('blink');
    }, 250);
    donationAmountTimeout = setTimeout(function (){
        input.removeClass('blink');
    },2500);
};


 window.giMembers = (function($, iban, undefined) {
    var nodes = {},

        /**
         * Initialize the module
         */
        init = function() {
            cacheNodes();
            initEditableForms();
            initPagination();
            initAjaxifyForms();
            initIBAN();
            initReload();
        },

        /**
         * Store all needed DOM nodes
         */
        cacheNodes = function() {
            nodes.container = $('.gi-members');
            nodes.boxes = nodes.container.find('.gi-members-box');
            nodes.forms = nodes.boxes.filter('.gi-members-box--editable');
            nodes.reload = nodes.boxes.filter('.gi-members-box--reload');
            nodes.pagination = nodes.container.find('.gi-members-paginate');
            nodes.login = $('.tx-felogin-pi1 .gi-members-form--login');
        },

        /**
         * Make the forms editable
         */
        initEditableForms = function() {
            nodes.forms.editableForm({
                onEditable: function(form, inputs) {
                    var invoiceAddress = form.find('#invoice_address');

                    if (invoiceAddress.length) {
                        var invoiceCheckbox = form.find('#invoice_address_checkbox');

                        invoiceCheckbox.on('change.giMembers', function() {
                            if (invoiceCheckbox.is(':checked')) {
                                invoiceAddress
                                    .prop('disabled', false)
                                    .show();
                            } else {
                                invoiceAddress
                                    .prop('disabled', true)
                                    .hide();
                            }
                        }).trigger('change.giMembers');
                    }
                },
                onNotEditable: function(form, inputs) {
                    var invoiceCheckbox = form.find('#invoice_address_checkbox');

                    if (invoiceCheckbox.length) {
                        invoiceCheckbox.off('.giMembers');
                    }
                }
            });
        },

        /**
         * Ajaxify the fluid pagination
         */
        initPagination = function() {
            nodes.pagination.on('click', '.pagination a', function(event) {
                event.preventDefault();

                var node = $(this),
                    container = node.closest('.gi-members-paginate'),
                    url = node.attr('href'),
                    id = container.attr('id'),
                    loadingContent = container.data('ajaxLoadingContent');

                if (loadingContent) {
                    loadingContent = $(loadingContent);
                    loadingContent.css({
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        zIndex: 10
                    });

                    container.append(loadingContent);
                }

                container.addClass('gi-members-paginate--loading');

                $.ajax({
                    url: url,
                    type: 'GET'
                }).done(function(responseText) {
                    container.html(
                        $('<div>').append($.parseHTML(responseText)).find('#' + id).html()
                    );
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.log('ajax error', jqXHR, textStatus, errorThrown);
                }).always(function() {
                    container.removeClass('gi-members-paginate--loading');

                    loadingContent && loadingContent.remove();
                });
            });
        },

        /**
         * Submit forms with ajax
         */
        initAjaxifyForms = function() {
            nodes.container.on('submit', '.gi-members-form--ajaxify', function(event) {
                event.preventDefault();

                var node = $(this),
                    container = node.closest('.gi-members'),
                    url = node.attr('action'),
                    method = node.attr('method') || 'get',
                    data = node.serializeArray(),
                    loadingContent = node.data('ajaxLoadingContent'),
                    flashMessages = container.find('.typo3-messages');

                if (loadingContent) {
                    loadingContent = $(loadingContent);
                    loadingContent.css({
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        zIndex: 10
                    });

                    node.append(loadingContent);
                }

                flashMessages.remove();
                node.addClass('gi-members-form--loading');

                $.ajax({
                    url: url,
                    type: method,
                    data: data
                }).done(function(responseText) {
                    container.html(
                        $('<div>').append($.parseHTML(responseText)).find('.gi-members').html()
                    );
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    node[0].reset();
                }).always(function() {
                    node && node.removeClass('gi-members-form--loading');
                    loadingContent && loadingContent.remove();
                });
            });
        },

        /**
         * Init IBAN and BIC check and transformation
         */
        initIBAN = function() {
            nodes.container.on('input', '.gi-members-input--iban', function() {

                var node = $(this),
                    val = node.val(),
                    country = val.slice(0,2),
                    regex;

                if (iban && iban.printFormat && iban.electronicFormat) {
                    val = iban.printFormat(val, '');
                    node.val(val);

                    country = iban.electronicFormat(country);
                    if (country && iban.countries[country]) {
                        // string length
                        node.attr('minlength', iban.countries[country].length);
                        node.attr('maxlength', iban.countries[country].length);

                        // regex pattern
                        regex = '' + iban.countries[country]._regex();
                        // remove /^ and $/
                        regex = regex.slice(2, -2);
                        // add country to the regex
                        regex = '([A-Z]{2}[0-9]{2})' + regex;
                        node.attr('pattern', regex);
                    } else {
                        node.attr('minlength', 3);
                        node.removeAttr('maxlength');
                        node.removeAttr('pattern');
                    }
                }
            });
            nodes.container.on('input', '.gi-members-input--bic', function() {
                var node = $(this),
                    val = node.val();

                iban && iban.electronicFormat && node.val(iban.electronicFormat(val));
            });
        },

        /**
         * Check if we need to do an ajax reload to get the proper data
         */
        initReload = function() {
            if (nodes.reload && nodes.reload.length) {
                var url = nodes.reload.eq(0).data('reloadUrl'),
                    loaders = [];

                nodes.reload.each(function() {
                    var node = $(this),
                        loadingContent = node.data('ajaxLoadingContent');

                    if (loadingContent) {
                        loadingContent = $(loadingContent);
                        loadingContent.css({
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            zIndex: 10
                        });

                        node.append(loadingContent);

                        loaders.push(loadingContent);
                    }

                    node.addClass('gi-members-box--loading');
                });

                $.ajax({
                    url: url
                }).done(function(responseText) {
                    var content = $('<div>').append($.parseHTML(responseText));

                    // replace page content with the one from the response
                    nodes.reload.each(function() {
                        var node = $(this),
                            id;

                        if ($(node).hasClass('gi-members-box--no-form')) {
                            var form = node;
                        } else {
                            var form = node.find('form');
                        }

                        // pagination fallback
                        form = form && form.length ? form : node.find('.gi-members-paginate');

                        id = form.attr('id');

                        if (id) {
                            form.html(content.find('#' + id).html());
                        }
                    });

                    nodes.forms.trigger('toggleEditable.editableForm', false);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    // @todo
                    console.log('ajax error', jqXHR, textStatus, errorThrown);
                }).always(function() {
                    nodes.reload.removeClass('gi-members-box--loading');
                    // remove all loading spinners
                    loaders.reduce($.merge).remove();
                });
            }
        };

    return {
        init: init
    };
})(window.jQuery, window.IBAN);

window.giMembers.init();

var qsRegex;
var buttonFilter;
var filterType;
var filter = '';
var supportState = '';
var tagState = '';
var maxItems = false;

if ($('.grid').data('step')) {
    maxItems = $('.grid').data('step');
}

var maxItemsCounter = maxItems;

var $grid = $('.grid').isotope({
    itemSelector: '.grid-item',
    layoutMode: 'fitRows',
    percentPosition: true,
    fitRows: {
        gutter: '.gutter-sizer'
    },
    filter: function() {
        var searchResult = qsRegex ? $(this).text().match( qsRegex ) : true;
        var buttonResult = buttonFilter ? $(this).is( buttonFilter ) : true;

        var pageResult = true;
        if (maxItems) {
            pageResult = parseInt($(this).find('.number').text(), 10) <= maxItemsCounter;
            if($('.grid-item').length <= maxItemsCounter) {
                $('#campaignShorMoreItemsButton').hide();
            }
        }

        return searchResult && buttonResult && pageResult;
    }
});

$('#showOnlySupported').on( 'change', function() {
    if (this.checked) {
        if (filter === '*') {
            filter = '.support1';
            $('.isotope-filter.all').removeClass('active');
        } else {
            filter = filter+'.support1';
        }
    } else {
        filter = filter.replace(".support1", "");
    }
    buttonFilter = filter;
    $grid.isotope();
});

$('#filters').on( 'click', 'button', function() {
    buttonFilter = $(this).attr('data-filter');
    filterType = $(this).attr('data-type');

    if (filter !== '') {
        if (buttonFilter === '*') {
            filter = buttonFilter;
            $('.isotope-filter').removeClass('active');
            $('#showOnlySupported').prop('checked',false);
        } else if (filter !== '*') {
            if (filter.includes(filterType)) {
                var filterArray = filter.split('.');
                filter = '';
                filterArray.forEach(function(item){
                    if (item) {
                        if (item.includes(filterType)) {
                            $('[data-filter=".'+item).removeClass('active');
                            filter = filter+buttonFilter;
                        } else {
                            filter = filter+'.'+item;
                        }
                    }
                });
            } else {
                filter = filter+buttonFilter;
            }
        } else {
            filter = buttonFilter;
            $('.isotope-filter.all').removeClass('active');
        }
    } else {
        filter = buttonFilter;
        $('.isotope-filter.all').removeClass('active');
    }
    $(this).addClass('active');
    buttonFilter = filter;
    //show and filter inside all items
    maxItemsCounter = $('.grid-item').length;
    $grid.isotope();

    //show filter as hash in url
    if (filter === '*'){
        window.location.hash = '';
    } else {
        window.location.hash = 'filter=' + $(this).text().replace(/\s/g, '-').toLowerCase();
    }
});

var $quicksearch = $('#quicksearch').keyup( debounce( function() {
    qsRegex = new RegExp( $quicksearch.val(), 'gi' );
    //show and filter inside all items
    maxItemsCounter = $('.grid-item').length;
    $grid.isotope();
}) );

$(document).on('click','#removeImageButton',function(){
    $('#removeImage').val(1);
    $('#sfrForm').submit();
});

$(document).on('change','#gi-dateOfBirth-dummy',function(){
    changeDate($(this).val().split('.'));
});

$('.support input').on('change', function(){
    supportState = $(this).val();
    supportTypeRequired();
});

$('#upload-logo').on('change', function(){
    checkSize(this);
});

$('#upload-publication').on('change', function(){
    checkSize(this);
});

$(document).ready(function() {
    if ($('.support input').length) {
        supportState = $('.support input').val();
        supportTypeRequired();
    }

    if ($('body').find('.gi-campaign-notify').length) {
        if (notification) {
            $('header a, footer a').not('.allowed-link').each( function() {
                $(this).click(function() {
                    response = confirm(notification);
                    if (!response) {
                        return false;
                    }
                });
            });
        }
    }

    $("#gi-dateOfBirth-dummy").datepicker({format: 'dd.mm.yyyy'});
    $("#gi-term-dateBegin").datepicker({format: 'dd.mm.yyyy'});
    $("#gi-term-dateEnd").datepicker({format: 'dd.mm.yyyy'});

    if(typeof($("#gi-dateOfBirth-dummy").val()) !== 'undefined') {
        changeDate($('#gi-dateOfBirth-dummy').val().split('.'));
    }
});

function debounce( fn, threshold ) {
    var timeout;
    threshold = threshold || 100;
    return function debounced() {
        clearTimeout( timeout );
        var args = arguments;
        var _this = this;
        function delayed() {
            fn.apply( _this, args );
        }
        timeout = setTimeout( delayed, threshold );
    };
}

function changeDate(dateArray) {
    if (dateArray.length === 1) {
        dateArray[0] = 0;
        dateArray[1] = 0;
        dateArray[2] = 0;
    }
    $('#gi-dateOfBirth-day').val(dateArray[0]);
    $('#gi-dateOfBirth-month').val(dateArray[1]);
    $('#gi-dateOfBirth-year').val(dateArray[2]);
}

function supportTypeRequired() {
    if (supportState === 'yes') {
        $('.supporttypes select').attr('required', 'required');
    } else {
        $('.supporttypes select').prop('required', false);
    }
}

function showMoreItems() {
    maxItemsCounter = maxItemsCounter+maxItems;
    //$('.isotope-filter.all').click();
    $grid.isotope();
}

function checkSize(upload) {
    if(upload.files[0].size > $(upload).data('size')){
        $(upload).next('small').removeClass('text-muted');
        $(upload).next('small').addClass('text-danger');
        $(upload).val('');
    } else {
        $(upload).next('small').removeClass('text-danger');
        $(upload).next('small').addClass('text-muted');
    }
}

var $gridCustomSelect = $('.gi-campaign .grid-custom-select').isotope({
    itemSelector: '.grid-item',
    layoutMode: 'fitRows',
    percentPosition: true,
    fitRows: {
        gutter: '.gutter-sizer'
    },
});

$('.filter--tags.filter select').on('change',function (){
    var containerGrid = $(this).closest('.gi-campaign').find('.grid-custom-select').first();
   var containerFilter = $(this).closest('.filter--tags.filter');
   var filterData = [];
    containerFilter.find('select').each(function (){
        if($(this).val() !== ''){
            filterData.push($(this).val());
        }
    });
    if (filterData.length > 0){
        containerGrid.find('.grid-item').each(function (){
            var show = 1;
            var gridItem = $(this);
            filterData.forEach(function (value){
                if(gridItem.find('div[data-tag-filter="' + value + '"]').length < 1){
                    show = 0;
                }
            });
            gridItem.removeClass('hidden');
            if (show === 0){
                gridItem.addClass('hidden');
            }
        });
    } else{
        //enable all items
        containerGrid.find('.grid-item').removeClass('hidden');
    }
    $gridCustomSelect.isotope({filter:isotopBlkFilter});
});

var isotopBlkFilter = function (){
    if($(this).hasClass('hidden')){
        return false;
    }
    return true;
};


$('.collapse').on('shown.bs.collapse', function (e) {
    $gridCustomSelect.isotope('layout');
});
$('.collapse').on('hidden.bs.collapse', function (e) {
    $gridCustomSelect.isotope('layout');
});

function getHashFilter() {
    var hash = location.hash;
    var matches = location.hash.match( /filter=([^&]+)/i );
    var hashFilter = matches && matches[1];
    return hashFilter && decodeURIComponent( hashFilter );
}

function chooseFilterGiCampaign() {
    if($('.gi-campaign--filters').length > 0){
        var filter = getHashFilter();

        $('.gi-campaign--filters .isotope-filter').each(function (){
           var buttonText = $(this).text();
            buttonText = buttonText.replace(/ /g,"-").toLowerCase();
            if (filter === buttonText){
                $(this).trigger('click');
                //break
                return false;
            }

        });
    }
}

$(document).ready(function() {
    chooseFilterGiCampaign();
});

$(window).on( 'hashchange', chooseFilterGiCampaign);

/*!
 * shariff - v3.2.1 - Mon, 27 May 2019 08:23:32 GMT
 * https://github.com/heiseonline/shariff
 * Copyright (c) 2019 Ines Pauer, Philipp Busse, Sebastian Hilbig, Erich Kramer, Deniz Sesli
 * Licensed under the MIT license
 */
!function(e){function t(a){if(r[a])return r[a].exports;var n=r[a]={i:a,l:!1,exports:{}};return e[a].call(n.exports,n,n.exports,t),n.l=!0,n.exports}var r={};t.m=e,t.c=r,t.d=function(e,r,a){t.o(e,r)||Object.defineProperty(e,r,{configurable:!1,enumerable:!0,get:a})},t.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(r,"a",r),r},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=2)}([function(e,t,r){"use strict";function a(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}function n(e,t,r){if(e&&p.isObject(e)&&e instanceof a)return e;var n=new a;return n.parse(e,t,r),n}function i(e){return p.isString(e)&&(e=n(e)),e instanceof a?e.format():a.prototype.format.call(e)}function o(e,t){return n(e,!1,!0).resolve(t)}function s(e,t){return e?n(e,!1,!0).resolveObject(t):t}var l=r(10),p=r(12);t.parse=n,t.resolve=o,t.resolveObject=s,t.format=i,t.Url=a;var u=/^([a-z0-9.+-]+:)/i,h=/:[0-9]*$/,d=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,c=["<",">",'"',"`"," ","\r","\n","\t"],f=["{","}","|","\\","^","`"].concat(c),m=["'"].concat(f),b=["%","/","?",";","#"].concat(m),g=["/","?","#"],v=/^[+a-z0-9A-Z_-]{0,63}$/,k=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,j={javascript:!0,"javascript:":!0},y={javascript:!0,"javascript:":!0},z={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},T=r(13);a.prototype.parse=function(e,t,r){if(!p.isString(e))throw new TypeError("Parameter 'url' must be a string, not "+typeof e);var a=e.indexOf("?"),n=-1!==a&&a<e.indexOf("#")?"?":"#",i=e.split(n),o=/\\/g;i[0]=i[0].replace(o,"/"),e=i.join(n);var s=e;if(s=s.trim(),!r&&1===e.split("#").length){var h=d.exec(s);if(h)return this.path=s,this.href=s,this.pathname=h[1],h[2]?(this.search=h[2],this.query=t?T.parse(this.search.substr(1)):this.search.substr(1)):t&&(this.search="",this.query={}),this}var c=u.exec(s);if(c){c=c[0];var f=c.toLowerCase();this.protocol=f,s=s.substr(c.length)}if(r||c||s.match(/^\/\/[^@\/]+@[^@\/]+/)){var P="//"===s.substr(0,2);!P||c&&y[c]||(s=s.substr(2),this.slashes=!0)}if(!y[c]&&(P||c&&!z[c])){for(var w=-1,x=0;x<g.length;x++){var C=s.indexOf(g[x]);-1!==C&&(-1===w||C<w)&&(w=C)}var U,R;R=-1===w?s.lastIndexOf("@"):s.lastIndexOf("@",w),-1!==R&&(U=s.slice(0,R),s=s.slice(R+1),this.auth=decodeURIComponent(U)),w=-1;for(var x=0;x<b.length;x++){var C=s.indexOf(b[x]);-1!==C&&(-1===w||C<w)&&(w=C)}-1===w&&(w=s.length),this.host=s.slice(0,w),s=s.slice(w),this.parseHost(),this.hostname=this.hostname||"";var I="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!I)for(var S=this.hostname.split(/\./),x=0,D=S.length;x<D;x++){var O=S[x];if(O&&!O.match(v)){for(var L="",A=0,N=O.length;A<N;A++)O.charCodeAt(A)>127?L+="x":L+=O[A];if(!L.match(v)){var F=S.slice(0,x),M=S.slice(x+1),q=O.match(k);q&&(F.push(q[1]),M.unshift(q[2])),M.length&&(s="/"+M.join(".")+s),this.hostname=F.join(".");break}}}this.hostname.length>255?this.hostname="":this.hostname=this.hostname.toLowerCase(),I||(this.hostname=l.toASCII(this.hostname));var J=this.port?":"+this.port:"",E=this.hostname||"";this.host=E+J,this.href+=this.host,I&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==s[0]&&(s="/"+s))}if(!j[f])for(var x=0,D=m.length;x<D;x++){var V=m[x];if(-1!==s.indexOf(V)){var W=encodeURIComponent(V);W===V&&(W=escape(V)),s=s.split(V).join(W)}}var G=s.indexOf("#");-1!==G&&(this.hash=s.substr(G),s=s.slice(0,G));var B=s.indexOf("?");if(-1!==B?(this.search=s.substr(B),this.query=s.substr(B+1),t&&(this.query=T.parse(this.query)),s=s.slice(0,B)):t&&(this.search="",this.query={}),s&&(this.pathname=s),z[f]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){var J=this.pathname||"",Q=this.search||"";this.path=J+Q}return this.href=this.format(),this},a.prototype.format=function(){var e=this.auth||"";e&&(e=encodeURIComponent(e),e=e.replace(/%3A/i,":"),e+="@");var t=this.protocol||"",r=this.pathname||"",a=this.hash||"",n=!1,i="";this.host?n=e+this.host:this.hostname&&(n=e+(-1===this.hostname.indexOf(":")?this.hostname:"["+this.hostname+"]"),this.port&&(n+=":"+this.port)),this.query&&p.isObject(this.query)&&Object.keys(this.query).length&&(i=T.stringify(this.query));var o=this.search||i&&"?"+i||"";return t&&":"!==t.substr(-1)&&(t+=":"),this.slashes||(!t||z[t])&&!1!==n?(n="//"+(n||""),r&&"/"!==r.charAt(0)&&(r="/"+r)):n||(n=""),a&&"#"!==a.charAt(0)&&(a="#"+a),o&&"?"!==o.charAt(0)&&(o="?"+o),r=r.replace(/[?#]/g,function(e){return encodeURIComponent(e)}),o=o.replace("#","%23"),t+n+r+o+a},a.prototype.resolve=function(e){return this.resolveObject(n(e,!1,!0)).format()},a.prototype.resolveObject=function(e){if(p.isString(e)){var t=new a;t.parse(e,!1,!0),e=t}for(var r=new a,n=Object.keys(this),i=0;i<n.length;i++){var o=n[i];r[o]=this[o]}if(r.hash=e.hash,""===e.href)return r.href=r.format(),r;if(e.slashes&&!e.protocol){for(var s=Object.keys(e),l=0;l<s.length;l++){var u=s[l];"protocol"!==u&&(r[u]=e[u])}return z[r.protocol]&&r.hostname&&!r.pathname&&(r.path=r.pathname="/"),r.href=r.format(),r}if(e.protocol&&e.protocol!==r.protocol){if(!z[e.protocol]){for(var h=Object.keys(e),d=0;d<h.length;d++){var c=h[d];r[c]=e[c]}return r.href=r.format(),r}if(r.protocol=e.protocol,e.host||y[e.protocol])r.pathname=e.pathname;else{for(var f=(e.pathname||"").split("/");f.length&&!(e.host=f.shift()););e.host||(e.host=""),e.hostname||(e.hostname=""),""!==f[0]&&f.unshift(""),f.length<2&&f.unshift(""),r.pathname=f.join("/")}if(r.search=e.search,r.query=e.query,r.host=e.host||"",r.auth=e.auth,r.hostname=e.hostname||e.host,r.port=e.port,r.pathname||r.search){var m=r.pathname||"",b=r.search||"";r.path=m+b}return r.slashes=r.slashes||e.slashes,r.href=r.format(),r}var g=r.pathname&&"/"===r.pathname.charAt(0),v=e.host||e.pathname&&"/"===e.pathname.charAt(0),k=v||g||r.host&&e.pathname,j=k,T=r.pathname&&r.pathname.split("/")||[],f=e.pathname&&e.pathname.split("/")||[],P=r.protocol&&!z[r.protocol];if(P&&(r.hostname="",r.port=null,r.host&&(""===T[0]?T[0]=r.host:T.unshift(r.host)),r.host="",e.protocol&&(e.hostname=null,e.port=null,e.host&&(""===f[0]?f[0]=e.host:f.unshift(e.host)),e.host=null),k=k&&(""===f[0]||""===T[0])),v)r.host=e.host||""===e.host?e.host:r.host,r.hostname=e.hostname||""===e.hostname?e.hostname:r.hostname,r.search=e.search,r.query=e.query,T=f;else if(f.length)T||(T=[]),T.pop(),T=T.concat(f),r.search=e.search,r.query=e.query;else if(!p.isNullOrUndefined(e.search)){if(P){r.hostname=r.host=T.shift();var w=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@");w&&(r.auth=w.shift(),r.host=r.hostname=w.shift())}return r.search=e.search,r.query=e.query,p.isNull(r.pathname)&&p.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.href=r.format(),r}if(!T.length)return r.pathname=null,r.search?r.path="/"+r.search:r.path=null,r.href=r.format(),r;for(var x=T.slice(-1)[0],C=(r.host||e.host||T.length>1)&&("."===x||".."===x)||""===x,U=0,R=T.length;R>=0;R--)x=T[R],"."===x?T.splice(R,1):".."===x?(T.splice(R,1),U++):U&&(T.splice(R,1),U--);if(!k&&!j)for(;U--;U)T.unshift("..");!k||""===T[0]||T[0]&&"/"===T[0].charAt(0)||T.unshift(""),C&&"/"!==T.join("/").substr(-1)&&T.push("");var I=""===T[0]||T[0]&&"/"===T[0].charAt(0);if(P){r.hostname=r.host=I?"":T.length?T.shift():"";var w=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@");w&&(r.auth=w.shift(),r.host=r.hostname=w.shift())}return k=k||r.host&&T.length,k&&!I&&T.unshift(""),T.length?r.pathname=T.join("/"):(r.pathname=null,r.path=null),p.isNull(r.pathname)&&p.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.auth=e.auth||r.auth,r.slashes=r.slashes||e.slashes,r.href=r.format(),r},a.prototype.parseHost=function(){var e=this.host,t=h.exec(e);t&&(t=t[0],":"!==t&&(this.port=t.substr(1)),e=e.substr(0,e.length-t.length)),e&&(this.hostname=e)}},function(e,t){var r;r=function(){return this}();try{r=r||Function("return this")()||(0,eval)("this")}catch(e){"object"==typeof window&&(r=window)}e.exports=r},function(e,t,r){"use strict";r(3),e.exports=r(4)},function(e,t){},function(e,t,r){"use strict";(function(t){function a(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},i=function(){function e(e,t){for(var r=0;r<t.length;r++){var a=t[r];a.enumerable=a.enumerable||!1,a.configurable=!0,"value"in a&&(a.writable=!0),Object.defineProperty(e,a.key,a)}}return function(t,r,a){return r&&e(t.prototype,r),a&&e(t,a),t}}(),o=r(5),s=r(6),l=r(0),p={theme:"color",backendUrl:null,infoUrl:"http://ct.de/-2467514",infoDisplay:"blank",lang:"de",langFallback:"en",mailUrl:function(){var e=l.parse(this.getURL(),!0);return e.query.view="mail",delete e.search,l.format(e)},mailBody:function(){return this.getURL()},mediaUrl:null,orientation:"horizontal",buttonStyle:"standard",referrerTrack:null,services:["twitter","facebook","info"],title:t.document.title,twitterVia:null,flattrUser:null,flattrCategory:null,url:function(){var e=t.document.location.href,r=o("link[rel=canonical]").attr("href")||this.getMeta("og:url")||"";return r.length>0&&(r.indexOf("http")<0&&(r=0!==r.indexOf("//")?t.document.location.protocol+"//"+t.document.location.host+r:t.document.location.protocol+r),e=r),e}},u=function(){function e(t,r){var n=this;a(this,e),this.element=t,o(t).empty(),this.options=o.extend({},p,r,o(t).data()),this.services=Object.keys(s).filter(function(e){return n.isEnabledService(e)}).sort(function(e,t){var r=n.options.services;return r.indexOf(e)-r.indexOf(t)}).map(function(e){return s[e](n)}),this._addButtonList(),null!==this.options.backendUrl&&"icon"!==this.options.buttonStyle&&this.getShares(this._updateCounts.bind(this))}return i(e,[{key:"isEnabledService",value:function(e){return this.options.services.indexOf(e)>-1}},{key:"$socialshareElement",value:function(){return o(this.element)}},{key:"getLocalized",value:function(e,t){return"object"===n(e[t])?void 0===e[t][this.options.lang]?e[t][this.options.langFallback]:e[t][this.options.lang]:"string"==typeof e[t]?e[t]:void 0}},{key:"getMeta",value:function(e){return o('meta[name="'+e+'"],[property="'+e+'"]').attr("content")||""}},{key:"getInfoUrl",value:function(){return this.options.infoUrl}},{key:"getInfoDisplayPopup",value:function(){return"popup"===this.options.infoDisplay}},{key:"getInfoDisplayBlank",value:function(){return"popup"!==this.options.infoDisplay&&"self"!==this.options.infoDisplay}},{key:"getURL",value:function(){return this.getOption("url")}},{key:"getOption",value:function(e){var t=this.options[e];return"function"==typeof t?t.call(this):t}},{key:"getTitle",value:function(){var e=this.getOption("title");if(o(this.element).data().title)return e;e=e||this.getMeta("DC.title");var t=this.getMeta("DC.creator");return e&&t?e+" - "+t:e}},{key:"getReferrerTrack",value:function(){return this.options.referrerTrack||""}},{key:"getShares",value:function(e){var t=l.parse(this.options.backendUrl,!0);return t.query.url=this.getURL(),delete t.search,o.getJSON(l.format(t),e)}},{key:"_updateCounts",value:function(e,t,r){var a=this;e&&o.each(e,function(e,t){a.isEnabledService(e)&&(t>=1e3&&(t=Math.round(t/1e3)+"k"),o(a.element).find("."+e+" a").append(o("<span/>").addClass("share_count").text(t)))})}},{key:"_addButtonList",value:function(){var e=this,r=o("<ul/>").addClass(["theme-"+this.options.theme,"orientation-"+this.options.orientation,"button-style-"+this.options.buttonStyle,"shariff-col-"+this.options.services.length].join(" "));this.services.forEach(function(t){var a=o("<li/>").addClass("shariff-button "+t.name),n=o("<a/>").attr("href",t.shareUrl);if("standard"===e.options.buttonStyle){var i=o("<span/>").addClass("share_text").text(e.getLocalized(t,"shareText"));n.append(i)}void 0!==t.faPrefix&&void 0!==t.faName&&n.prepend(o("<span/>").addClass(t.faPrefix+" "+t.faName)),t.popup?(n.attr("data-rel","popup"),"info"!==t.name&&n.attr("rel","nofollow")):t.blank?(n.attr("target","_blank"),"info"===t.name?n.attr("rel","noopener noreferrer"):n.attr("rel","nofollow noopener noreferrer")):"info"!==t.name&&n.attr("rel","nofollow"),n.attr("title",e.getLocalized(t,"title")),n.attr("role","button"),n.attr("aria-label",e.getLocalized(t,"title")),a.append(n),r.append(a)}),r.on("click",'[data-rel="popup"]',function(e){e.preventDefault();var r=o(this).attr("href");if(r.match(/twitter\.com\/intent\/(\w+)/)){var a=t.window;if(a.__twttr&&a.__twttr.widgets&&a.__twttr.widgets.loaded)return}t.window.open(r,"_blank","width=600,height=460")}),this.$socialshareElement().append(r)}}]),e}();e.exports=u,t.Shariff=u,o(function(){o(".shariff").each(function(){this.hasOwnProperty("shariff")||(this.shariff=new u(this))})})}).call(t,r(1))},function(e,t,r){"use strict";function a(e,t){var r=[];return t=t||document,"function"==typeof e?(t.attachEvent?"complete"===t.readyState:"loading"!==t.readyState)?e():t.addEventListener("DOMContentLoaded",e):r=e instanceof Element?[e]:"string"==typeof e?"<"===e[0]?Array.prototype.slice.call(l(e)):Array.prototype.slice.call(t.querySelectorAll(e)):e,new n(r,t)}function n(e,t){this.length=e.length,this.context=t;var r=this;s(e,function(e){r[e]=this})}"function"!=typeof Object.assign&&(Object.assign=function(e,t){if(null===e)throw new TypeError("Cannot convert undefined or null to object");for(var r=Object(e),a=1;a<arguments.length;a++){var n=arguments[a];if(null!==n)for(var i in n)Object.prototype.hasOwnProperty.call(n,i)&&(r[i]=n[i])}return r}),n.prototype.each=function(e){for(var t=this.length-1;t>=0;t--)e.call(this[t],t,this[t]);return this},n.prototype.empty=function(){return this.each(i)},n.prototype.text=function(e){return void 0===e?this[0].textContent:this.each(function(){this.textContent=e})},n.prototype.attr=function(e,t){return this.length<1?null:void 0===t?this[0].getAttribute(e):this.each(function(){this.setAttribute(e,t)})},n.prototype.data=function(e,t){if(t)return this.attr("data-"+e,t);if(e)return this.attr("data-"+e);var r=Object.assign({},this[0].dataset);return s(r,function(e,t){r[e]=m(t)}),r},n.prototype.find=function(e){var t;return t=o(this,function(t){return t.querySelectorAll(e)}),t=o(t,function(e){return Array.prototype.slice.call(e)}),t=Array.prototype.concat.apply([],t),new n(t)},n.prototype.append=function(e){return"string"==typeof e&&(e=l(e)),p(this[0],e),this},n.prototype.prepend=function(e){return"string"==typeof e&&(e=l(e)),u(this[0],e),this},n.prototype.addClass=function(e){return this.each(function(){var t=this;e.split(" ").forEach(function(e){t.classList.add(e)})})},n.prototype.removeClass=function(e){return this.each(function(){this.classList.remove(e)})},n.prototype.on=function(e,t,r){return this.each(function(){d(t,e,r,this)})};var i=function(){for(;this.hasChildNodes();)this.removeChild(this.firstChild)},o=function(e,t){return Array.prototype.map.call(e,t)},s=function(e,t){if(e instanceof Array)for(var r=0;r<e.length;r++)t.call(e[r],r,e[r]);else if(e instanceof Object)for(var a in e)t.call(e[a],a,e[a],e);return e},l=function(e){var t=document.createElement("div");return t.innerHTML=e,t.children},p=function(e,t){for(var r=0;r<t.length;r++)e.appendChild(t[r])},u=function(e,t){for(var r=t.length-1;r>=0;r--)e.insertBefore(t[t.length-1],e.firstChild)},h=function(){var e=HTMLElement.prototype,t=e.matches||e.webkitMatchesSelector||e.mozMatchesSelector||e.msMatchesSelector;return function e(r,a){if(null!==r)return t.call(r,a)?r:e(r.parentElement,a)}}(),d=function(e,t,r,a){(a||document).addEventListener(t,function(t){var a=h(t.target,e);a&&r.call(a,t)})},c=function e(t){var r={},a=!1,n=0,i=arguments.length;for("[object Boolean]"===Object.prototype.toString.call(arguments[0])&&(a=arguments[0],n++);n<i;n++){var o=arguments[n];!function(t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(a&&"[object Object]"===Object.prototype.toString.call(t[n])?r[n]=e(!0,r[n],t[n]):r[n]=t[n])}(o)}return r},f=function(e,t){var r=new XMLHttpRequest;r.open("GET",e,!0),r.setRequestHeader("Content-Type","application/json"),r.setRequestHeader("Accept","application/json"),r.onload=function(){if(r.status>=200&&r.status<400){var e=JSON.parse(r.responseText);t(e,r.status,r)}else t(null,r.status,r)},r.onerror=function(e){t(new Error(e),null,r)},r.send()},m=function(e){if("true"===e)return!0;if("false"===e)return!1;if("null"===e)return null;if(+e+""===e)return+e;if(/^[[{]/.test(e))try{return JSON.parse(e)}catch(t){return e}return e};a.extend=c,a.map=o,a.each=s,a.getJSON=f,e.exports=a},function(e,t,r){"use strict";e.exports={addthis:r(7),buffer:r(8),diaspora:r(9),facebook:r(16),flattr:r(17),flipboard:r(18),info:r(19),linkedin:r(20),mail:r(21),pinterest:r(22),pocket:r(23),print:r(24),qzone:r(25),reddit:r(26),stumbleupon:r(27),telegram:r(28),tencent:r(29),threema:r(30),tumblr:r(31),twitter:r(32),vk:r(33),weibo:r(34),whatsapp:r(35),xing:r(36)}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"addthis",faPrefix:"fas",faName:"fa-plus",title:{bg:"Сподели в AddThis",cs:"Sdílet na AddThis",da:"Del på AddThis",de:"Bei AddThis teilen",en:"Share on AddThis",es:"Compartir en AddThis",fi:"Jaa AddThisissä",fr:"Partager sur AddThis",hr:"Podijelite na AddThis",hu:"Megosztás AddThisen",it:"Condividi su AddThis",ja:"AddThis上で共有",ko:"AddThis에서 공유하기",nl:"Delen op AddThis",no:"Del på AddThis",pl:"Udostępnij przez AddThis",pt:"Compartilhar no AddThis",ro:"Partajează pe AddThis",ru:"Поделиться на AddThis",sk:"Zdieľať na AddThis",sl:"Deli na AddThis",sr:"Podeli na AddThis",sv:"Dela på AddThis",tr:"AddThis'ta paylaş",zh:"在AddThis上分享"},shareUrl:"http://api.addthis.com/oexchange/0.8/offer?url="+encodeURIComponent(e.getURL())+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL());return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"buffer",faPrefix:"fab",faName:"fa-buffer",title:{bg:"Сподели в buffer",cs:"Sdílet na buffer",da:"Del på buffer",de:"Bei buffer teilen",en:"Share on buffer",es:"Compartir en buffer",fi:"Jaa bufferissä",fr:"Partager sur buffer",hr:"Podijelite na buffer",hu:"Megosztás bufferen",it:"Condividi su buffer",ja:"buffer上で共有",ko:"buffer에서 공유하기",nl:"Delen op buffer",no:"Del på buffer",pl:"Udostępnij przez buffer",pt:"Compartilhar no buffer",ro:"Partajează pe buffer",ru:"Поделиться на buffer",sk:"Zdieľať na buffer",sl:"Deli na buffer",sr:"Podeli na buffer",sv:"Dela på buffer",tr:"buffer'ta paylaş",zh:"在buffer上分享"},shareUrl:"https://buffer.com/add?text="+encodeURIComponent(e.getTitle())+"&url="+t+e.getReferrerTrack()}}},function(e,t,r){"use strict";var a=r(0);e.exports=function(e){var t=a.parse("https://share.diasporafoundation.org/",!0);return t.query.url=e.getURL(),t.query.title=e.getTitle(),t.protocol="https",delete t.search,{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"diaspora",faPrefix:"fas",faName:"fa-asterisk",title:{bg:"Сподели в diaspora*",cs:"Sdílet na diaspora*",da:"Del på diaspora*",de:"Bei diaspora* teilen",en:"Share on diaspora*",es:"Compartir en diaspora*",fi:"Jaa Diasporaissä",fr:"Partager sur diaspora*",hr:"Podijelite na diaspora*",hu:"Megosztás diaspora*",it:"Condividi su diaspora*",ja:"diaspora*上で共有",ko:"diaspora*에서 공유하기",nl:"Delen op diaspora*",no:"Del på diaspora*",pl:"Udostępnij przez diaspora*",pt:"Compartilhar no diaspora*",ro:"Partajează pe diaspora*",ru:"Поделиться на diaspora*",sk:"Zdieľať na diaspora*",sl:"Deli na diaspora*",sr:"Podeli na diaspora*-u",sv:"Dela på diaspora*",tr:"diaspora*'ta paylaş",zh:"分享至diaspora*"},shareUrl:a.format(t)+e.getReferrerTrack()}}},function(e,t,r){(function(e,a){var n;!function(a){function i(e){throw new RangeError(I[e])}function o(e,t){for(var r=e.length,a=[];r--;)a[r]=t(e[r]);return a}function s(e,t){var r=e.split("@"),a="";return r.length>1&&(a=r[0]+"@",e=r[1]),e=e.replace(R,"."),a+o(e.split("."),t).join(".")}function l(e){for(var t,r,a=[],n=0,i=e.length;n<i;)t=e.charCodeAt(n++),t>=55296&&t<=56319&&n<i?(r=e.charCodeAt(n++),56320==(64512&r)?a.push(((1023&t)<<10)+(1023&r)+65536):(a.push(t),n--)):a.push(t);return a}function p(e){return o(e,function(e){var t="";return e>65535&&(e-=65536,t+=O(e>>>10&1023|55296),e=56320|1023&e),t+=O(e)}).join("")}function u(e){return e-48<10?e-22:e-65<26?e-65:e-97<26?e-97:k}function h(e,t){return e+22+75*(e<26)-((0!=t)<<5)}function d(e,t,r){var a=0;for(e=r?D(e/T):e>>1,e+=D(e/t);e>S*y>>1;a+=k)e=D(e/S);return D(a+(S+1)*e/(e+z))}function c(e){var t,r,a,n,o,s,l,h,c,f,m=[],b=e.length,g=0,z=w,T=P;for(r=e.lastIndexOf(x),r<0&&(r=0),a=0;a<r;++a)e.charCodeAt(a)>=128&&i("not-basic"),m.push(e.charCodeAt(a));for(n=r>0?r+1:0;n<b;){for(o=g,s=1,l=k;n>=b&&i("invalid-input"),h=u(e.charCodeAt(n++)),(h>=k||h>D((v-g)/s))&&i("overflow"),g+=h*s,c=l<=T?j:l>=T+y?y:l-T,!(h<c);l+=k)f=k-c,s>D(v/f)&&i("overflow"),s*=f;t=m.length+1,T=d(g-o,t,0==o),D(g/t)>v-z&&i("overflow"),z+=D(g/t),g%=t,m.splice(g++,0,z)}return p(m)}function f(e){var t,r,a,n,o,s,p,u,c,f,m,b,g,z,T,C=[];for(e=l(e),b=e.length,t=w,r=0,o=P,s=0;s<b;++s)(m=e[s])<128&&C.push(O(m));for(a=n=C.length,n&&C.push(x);a<b;){for(p=v,s=0;s<b;++s)(m=e[s])>=t&&m<p&&(p=m);for(g=a+1,p-t>D((v-r)/g)&&i("overflow"),r+=(p-t)*g,t=p,s=0;s<b;++s)if(m=e[s],m<t&&++r>v&&i("overflow"),m==t){for(u=r,c=k;f=c<=o?j:c>=o+y?y:c-o,!(u<f);c+=k)T=u-f,z=k-f,C.push(O(h(f+T%z,0))),u=D(T/z);C.push(O(h(u,0))),o=d(r,g,a==n),r=0,++a}++r,++t}return C.join("")}function m(e){return s(e,function(e){return C.test(e)?c(e.slice(4).toLowerCase()):e})}function b(e){return s(e,function(e){return U.test(e)?"xn--"+f(e):e})}var g,v=("object"==typeof t&&t&&t.nodeType,"object"==typeof e&&e&&e.nodeType,2147483647),k=36,j=1,y=26,z=38,T=700,P=72,w=128,x="-",C=/^xn--/,U=/[^\x20-\x7E]/,R=/[\x2E\u3002\uFF0E\uFF61]/g,I={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},S=k-j,D=Math.floor,O=String.fromCharCode;g={version:"1.4.1",ucs2:{decode:l,encode:p},decode:c,encode:f,toASCII:b,toUnicode:m},void 0!==(n=function(){return g}.call(t,r,t,e))&&(e.exports=n)}()}).call(t,r(11)(e),r(1))},function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children||(e.children=[]),Object.defineProperty(e,"loaded",{enumerable:!0,get:function(){return e.l}}),Object.defineProperty(e,"id",{enumerable:!0,get:function(){return e.i}}),e.webpackPolyfill=1),e}},function(e,t,r){"use strict";e.exports={isString:function(e){return"string"==typeof e},isObject:function(e){return"object"==typeof e&&null!==e},isNull:function(e){return null===e},isNullOrUndefined:function(e){return null==e}}},function(e,t,r){"use strict";t.decode=t.parse=r(14),t.encode=t.stringify=r(15)},function(e,t,r){"use strict";function a(e,t){return Object.prototype.hasOwnProperty.call(e,t)}e.exports=function(e,t,r,i){t=t||"&",r=r||"=";var o={};if("string"!=typeof e||0===e.length)return o;var s=/\+/g;e=e.split(t);var l=1e3;i&&"number"==typeof i.maxKeys&&(l=i.maxKeys);var p=e.length;l>0&&p>l&&(p=l);for(var u=0;u<p;++u){var h,d,c,f,m=e[u].replace(s,"%20"),b=m.indexOf(r);b>=0?(h=m.substr(0,b),d=m.substr(b+1)):(h=m,d=""),c=decodeURIComponent(h),f=decodeURIComponent(d),a(o,c)?n(o[c])?o[c].push(f):o[c]=[o[c],f]:o[c]=f}return o};var n=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)}},function(e,t,r){"use strict";function a(e,t){if(e.map)return e.map(t);for(var r=[],a=0;a<e.length;a++)r.push(t(e[a],a));return r}var n=function(e){switch(typeof e){case"string":return e;case"boolean":return e?"true":"false";case"number":return isFinite(e)?e:"";default:return""}};e.exports=function(e,t,r,s){return t=t||"&",r=r||"=",null===e&&(e=void 0),"object"==typeof e?a(o(e),function(o){var s=encodeURIComponent(n(o))+r;return i(e[o])?a(e[o],function(e){return s+encodeURIComponent(n(e))}).join(t):s+encodeURIComponent(n(e[o]))}).join(t):s?encodeURIComponent(n(s))+r+encodeURIComponent(n(e)):""};var i=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)},o=Object.keys||function(e){var t=[];for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.push(r);return t}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"facebook",faPrefix:"fab",faName:"fa-facebook-f",title:{bg:"Сподели във Facebook",cs:"Sdílet na Facebooku",da:"Del på Facebook",de:"Bei Facebook teilen",en:"Share on Facebook",es:"Compartir en Facebook",fi:"Jaa Facebookissa",fr:"Partager sur Facebook",hr:"Podijelite na Facebooku",hu:"Megosztás Facebookon",it:"Condividi su Facebook",ja:"フェイスブック上で共有",ko:"페이스북에서 공유하기",nl:"Delen op Facebook",no:"Del på Facebook",pl:"Udostępnij na Facebooku",pt:"Compartilhar no Facebook",ro:"Partajează pe Facebook",ru:"Поделиться на Facebook",sk:"Zdieľať na Facebooku",sl:"Deli na Facebooku",sr:"Podeli na Facebook-u",sv:"Dela på Facebook",tr:"Facebook'ta paylaş",zh:"在Facebook上分享"},shareUrl:"https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(e.getURL())+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL()),r=e.getTitle(),a=e.getMeta("description");return{popup:!0,shareText:"Flattr",name:"flattr",faPrefix:"far",faName:"fa-money-bill-alt",title:{de:"Artikel flattrn",en:"Flattr this"},shareUrl:"https://flattr.com/submit/auto?title="+encodeURIComponent(r)+"&description="+encodeURIComponent(a)+"&category="+encodeURIComponent(e.options.flattrCategory||"text")+"&user_id="+encodeURIComponent(e.options.flattrUser)+"&url="+t+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL());return{popup:!0,shareText:"flip it",name:"flipboard",faPrefix:"fab",faName:"fa-flipboard",title:{bg:"Сподели в Flipboard",cs:"Sdílet na Flipboardu",da:"Del på Flipboard",de:"Bei Flipboard teilen",en:"Share on Flipboard",es:"Compartir en Flipboard",fi:"Jaa Flipboardissä",fr:"Partager sur Flipboard",hr:"Podijelite na Flipboardu",hu:"Megosztás Flipboardon",it:"Condividi su Flipboard",ja:"Flipboard上で共有",ko:"Flipboard에서 공유하기",nl:"Delen op Flipboard",no:"Del på Flipboard",pl:"Udostępnij na Flipboardu",pt:"Compartilhar no Flipboard",ro:"Partajează pe Flipboard",ru:"Поделиться на Flipboard",sk:"Zdieľať na Flipboardu",sl:"Deli na Flipboardu",sr:"Podeli na Flipboard-u",sv:"Dela på Flipboard",tr:"Flipboard'ta paylaş",zh:"在Flipboard上分享"},shareUrl:"https://share.flipboard.com/bookmarklet/popout?v=2&title="+encodeURIComponent(e.getTitle())+"&url="+t+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{blank:e.getInfoDisplayBlank(),popup:e.getInfoDisplayPopup(),shareText:"Info",name:"info",faPrefix:"fas",faName:"fa-info",title:{bg:"Повече информация",cs:"Více informací",da:"Flere oplysninger",de:"Weitere Informationen",en:"More information",es:"Más informaciones",fi:"Lisätietoja",fr:"Plus d'informations",hr:"Više informacija",hu:"Több információ",it:"Maggiori informazioni",ja:"詳しい情報",ko:"추가 정보",nl:"Verdere informatie",no:"Mer informasjon",pl:"Więcej informacji",pt:"Mais informações",ro:"Mai multe informatii",ru:"Больше информации",sk:"Viac informácií",sl:"Več informacij",sr:"Više informacija",sv:"Mer information",tr:"Daha fazla bilgi",zh:"更多信息"},shareUrl:e.getInfoUrl()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL()),r=encodeURIComponent(e.getTitle());return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"mitteilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"シェア",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"distribuiți",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"linkedin",faPrefix:"fab",faName:"fa-linkedin-in",title:{bg:"Сподели в LinkedIn",cs:"Sdílet na LinkedIn",da:"Del på LinkedIn",de:"Bei LinkedIn teilen",en:"Share on LinkedIn",es:"Compartir en LinkedIn",fi:"Jaa LinkedInissä",fr:"Partager sur LinkedIn",hr:"Podijelite na LinkedIn",hu:"Megosztás LinkedInen",it:"Condividi su LinkedIn",ja:"LinkedIn上で共有",ko:"LinkedIn에서 공유하기",nl:"Delen op LinkedIn",no:"Del på LinkedIn",pl:"Udostępnij przez LinkedIn",pt:"Compartilhar no LinkedIn",ro:"Partajează pe LinkedIn",ru:"Поделиться на LinkedIn",sk:"Zdieľať na LinkedIn",sl:"Deli na LinkedIn",sr:"Podeli na LinkedIn-u",sv:"Dela på LinkedIn",tr:"LinkedIn'ta paylaş",zh:"在LinkedIn上分享"},shareUrl:"https://www.linkedin.com/shareArticle?mini=true&summary="+encodeURIComponent(e.getMeta("description"))+"&title="+r+"&url="+t}}},function(e,t,r){"use strict";e.exports=function(e){var t=e.getOption("mailUrl");return 0===t.indexOf("mailto:")&&(t+="?subject="+encodeURIComponent(e.getOption("mailSubject")||e.getTitle()),t+="&body="+encodeURIComponent(e.getOption("mailBody").replace(/\{url\}/i,e.getURL()))),{blank:0===t.indexOf("http"),popup:!1,shareText:{en:"mail",zh:"分享"},name:"mail",faPrefix:"fas",faName:"fa-envelope",title:{bg:"Изпрати по имейл",cs:"Poslat mailem",da:"Sende via e-mail",de:"Per E-Mail versenden",en:"Send by email",es:"Enviar por email",fi:"Lähetä sähköpostitse",fr:"Envoyer par courriel",hr:"Pošaljite emailom",hu:"Elküldés e-mailben",it:"Inviare via email",ja:"電子メールで送信",ko:"이메일로 보내기",nl:"Sturen via e-mail",no:"Send via epost",pl:"Wyślij e-mailem",pt:"Enviar por e-mail",ro:"Trimite prin e-mail",ru:"Отправить по эл. почте",sk:"Poslať e-mailom",sl:"Pošlji po elektronski pošti",sr:"Pošalji putem email-a",sv:"Skicka via e-post",tr:"E-posta ile gönder",zh:"通过电子邮件传送"},shareUrl:t}}},function(e,t,r){"use strict";var a=r(0);e.exports=function(e){var t=e.getTitle(),r=e.getMeta("DC.creator");r.length>0&&(t+=" - "+r);var n=e.getOption("mediaUrl");(!n||n.length<=0)&&(n=e.getMeta("og:image"));var i=a.parse("https://www.pinterest.com/pin/create/link/",!0);return i.query.url=e.getURL(),i.query.media=n,i.query.description=t,delete i.search,{popup:!0,shareText:"pin it",name:"pinterest",faPrefix:"fab",faName:"fa-pinterest-p",title:{bg:"Сподели в Pinterest",cs:"Přidat na Pinterest",da:"Del på Pinterest",de:"Bei Pinterest pinnen",en:"Pin it on Pinterest",es:"Compartir en Pinterest",fi:"Jaa Pinterestissä",fr:"Partager sur Pinterest",hr:"Podijelite na Pinterest",hu:"Megosztás Pinteresten",it:"Condividi su Pinterest",ja:"Pinterest上で共有",ko:"Pinterest에서 공유하기",nl:"Delen op Pinterest",no:"Del på Pinterest",pl:"Udostępnij przez Pinterest",pt:"Compartilhar no Pinterest",ro:"Partajează pe Pinterest",ru:"Поделиться на Pinterest",sk:"Zdieľať na Pinterest",sl:"Deli na Pinterest",sr:"Podeli na Pinterest-u",sv:"Dela på Pinterest",tr:"Pinterest'ta paylaş",zh:"分享至Pinterest"},shareUrl:a.format(i)+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL());return{popup:!0,shareText:"Pocket",name:"pocket",faPrefix:"fab",faName:"fa-get-pocket",title:{bg:"Запазване в Pocket",cs:"Uložit do Pocket",da:"Gem i Pocket",de:"In Pocket speichern",en:"Save to Pocket",es:"Guardar en Pocket",fi:"Tallenna kohtaan Pocket",fr:"Enregistrer dans Pocket",hr:"Spremi u Pocket",hu:'Mentés "Pocket"-be',it:"Salva in Pocket",ja:"「ポケット」に保存",ko:"Pocket에 저장",nl:"Opslaan in Pocket",no:"Lagre i Pocket",pl:"Zapisz w Pocket",pt:"Salvar em Pocket",ro:"Salvați în Pocket",ru:"Сохранить в Pocket",sk:"Uložiť do priečinka Pocket",sl:"Shrani v Pocket",sr:"Sačuvaj u Pocket",sv:"Spara till Pocket",tr:"Pocket e kaydet",zh:"保存到Pocket"},shareUrl:"https://getpocket.com/save?title="+encodeURIComponent(e.getTitle())+"&url="+t+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{name:"print",faPrefix:"fas",faName:"fa-print",popup:!1,shareText:{bg:"",cs:"tlačit",da:"",de:"drucken",en:"print",es:"impresión",fi:"",fr:"imprimer",hr:"",hu:"",it:"stampa",ja:"",ko:"",nl:"afdrukken",no:"",pl:"drukuj",pt:"",ro:"",ru:"Распечатать",sk:"",sl:"",sr:"",sv:"",tr:"",zh:""},title:{bg:"",cs:"tlačit",da:"",de:"drucken",en:"print",es:"impresión",fi:"",fr:"imprimer",hr:"",hu:"",it:"stampa",ja:"",ko:"",nl:"afdrukken",no:"",pl:"drukuj",pt:"",ro:"",ru:"Распечатать",sk:"",sl:"",sr:"",sv:"",tr:"",zh:""},shareUrl:"javascript:window.print();"}}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"qzone",faPrefix:"fab",faName:"fa-qq",title:{bg:"Сподели в Qzone",cs:"Sdílet na Qzone",da:"Del på Qzone",de:"Bei Qzone teilen",en:"Share on Qzone",es:"Compartir en Qzone",fi:"Jaa Qzoneissä",fr:"Partager sur Qzone",hr:"Podijelite na Qzone",hu:"Megosztás Qzone",it:"Condividi su Qzone",ja:"Qzone上で共有",ko:"Qzone에서 공유하기",nl:"Delen op Qzone",no:"Del på Qzone",pl:"Udostępnij przez Qzone",pt:"Compartilhar no Qzone",ro:"Partajează pe Qzone",ru:"Поделиться на Qzone",sk:"Zdieľať na Qzone",sl:"Deli na Qzone",sr:"Podeli na Qzone-u",sv:"Dela på Qzone",tr:"Qzone'ta paylaş",zh:"分享至QQ空间"},shareUrl:"http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url="+encodeURIComponent(e.getURL())+"&title="+e.getTitle()+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL()),r=encodeURIComponent(e.getTitle());return""!==r&&(r="&title="+r),{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"reddit",faPrefix:"fab",faName:"fa-reddit-alien",title:{bg:"Сподели в Reddit",cs:"Sdílet na Redditu",da:"Del på Reddit",de:"Bei Reddit teilen",en:"Share on Reddit",es:"Compartir en Reddit",fi:"Jaa Redditissä",fr:"Partager sur Reddit",hr:"Podijelite na Reddit",hu:"Megosztás Redditen",it:"Condividi su Reddit",ja:"Reddit上で共有",ko:"Reddit에서 공유하기",nl:"Delen op Reddit",no:"Del på Reddit",pl:"Udostępnij przez Reddit",pt:"Compartilhar no Reddit",ro:"Partajează pe Reddit",ru:"Поделиться на Reddit",sk:"Zdieľať na Reddit",sl:"Deli na Reddit",sr:"Podeli na Reddit-u",sv:"Dela på Reddit",tr:"Reddit'ta paylaş",zh:"分享至Reddit"},shareUrl:"https://reddit.com/submit?url="+t+r+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL()),r=encodeURIComponent(e.getTitle());return""!==r&&(r="&title="+r),{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"stumbleupon",faPrefix:"fab",faName:"fa-stumbleupon",title:{bg:"Сподели в Stumbleupon",cs:"Sdílet na Stumbleuponu",da:"Del på Stumbleupon",de:"Bei Stumbleupon teilen",en:"Share on Stumbleupon",es:"Compartir en Stumbleupon",fi:"Jaa Stumbleuponissä",fr:"Partager sur Stumbleupon",hr:"Podijelite na Stumbleupon",hu:"Megosztás Stumbleupon",it:"Condividi su Stumbleupon",ja:"Stumbleupon上で共有",ko:"Stumbleupon에서 공유하기",nl:"Delen op Stumbleupon",no:"Del på Stumbleupon",pl:"Udostępnij przez Stumbleupon",pt:"Compartilhar no Stumbleupon",ro:"Partajează pe Stumbleupon",ru:"Поделиться на Stumbleupon",sk:"Zdieľať na Stumbleupon",sl:"Deli na Stumbleupon",sr:"Podeli na Stumbleupon-u",sv:"Dela på Stumbleupon",tr:"Stumbleupon'ta paylaş",zh:"分享至Stumbleupon"},shareUrl:"https://www.stumbleupon.com/submit?url="+t+r+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"telegram",faPrefix:"fab",faName:"fa-telegram",title:{bg:"Сподели в Telegram",cs:"Sdílet na Telegramu",da:"Del på Telegram",de:"Bei Telegram teilen",en:"Share on Telegram",es:"Compartir en Telegram",fi:"Jaa Telegramissä",fr:"Partager sur Telegram",hr:"Podijelite na Telegram",hu:"Megosztás Telegramen",it:"Condividi su Telegram",ja:"Telegram上で共有",ko:"Telegram에서 공유하기",nl:"Delen op Telegram",no:"Del på Telegram",pl:"Udostępnij przez Telegram",pt:"Compartilhar no Telegram",ro:"Partajează pe Telegram",ru:"Поделиться на Telegram",sk:"Zdieľať na Telegram",sl:"Deli na Telegram",sr:"Podeli na Telegram-u",sv:"Dela på Telegram",tr:"Telegram'ta paylaş",zh:"在Telegram上分享"},shareUrl:"https://t.me/share/url?url="+encodeURIComponent(e.getURL())+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"tencent-weibo",faPrefix:"fab",faName:"fa-tencent-weibo",title:{bg:"Сподели в tencent weibo",cs:"Sdílet na tencent weibo",da:"Del på tencent weibo",de:"Bei tencent weibo teilen",en:"Share on tencent weibo",es:"Compartir en tencent weibo",fi:"Jaa tencent weiboissä",fr:"Partager sur tencent weibo",hr:"Podijelite na tencent weibo",hu:"Megosztás tencent weiboen",it:"Condividi su tencent weibo",ja:"Tencent weibo上で共有",ko:"Tencent weibo에서 공유하기",nl:"Delen op tencent weibo",no:"Del på tencent weibo",pl:"Udostępnij przez tencent weibo",pt:"Compartilhar no tencent weibo",ro:"Partajează pe tencent weibo",ru:"Поделиться на tencent weibo",sk:"Zdieľať na tencent weibo",sl:"Deli na tencent weibo",sr:"Podeli na tencent weibo-u",sv:"Dela på tencent weibo",tr:"Tencent weibo'ta paylaş",zh:"分享至腾讯微博"},shareUrl:"http://v.t.qq.com/share/share.php?url="+encodeURIComponent(e.getURL())+"&title="+e.getTitle()+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL()),r=e.getTitle();return{popup:!1,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"threema",faPrefix:"fas",faName:"fa-lock",title:{bg:"Сподели в Threema",cs:"Sdílet na Threema",da:"Del på Threema",de:"Bei Threema teilen",en:"Share on Threema",es:"Compartir en Threema",fi:"Jaa Threemaissä",fr:"Partager sur Threema",hr:"Podijelite na Threema",hu:"Megosztás Threemaen",it:"Condividi su Threema",ja:"Threema上で共有",ko:"Threema에서 공유하기",nl:"Delen op Threema",no:"Del på Threema",pl:"Udostępnij przez Threema",pt:"Compartilhar no Threema",ro:"Partajează pe Threema",ru:"Поделиться на Threema",sk:"Zdieľať na Threema",sl:"Deli na Threema",sr:"Podeli na Threema-u",sv:"Dela på Threema",tr:"Threema'ta paylaş",zh:"在Threema上分享"},shareUrl:"threema://compose?text="+encodeURIComponent(r)+"%20"+t+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"tumblr",faPrefix:"fab",faName:"fa-tumblr",title:{bg:"Сподели в tumblr",cs:"Sdílet na tumblru",da:"Del på tumblr",de:"Bei tumblr teilen",en:"Share on tumblr",es:"Compartir en tumblr",fi:"Jaa tumblrissä",fr:"Partager sur tumblr",hr:"Podijelite na tumblr",hu:"Megosztás tumblren",it:"Condividi su tumblr",ja:"tumblr上で共有",ko:"tumblr에서 공유하기",nl:"Delen op tumblr",no:"Del på tumblr",pl:"Udostępnij przez tumblr",pt:"Compartilhar no tumblr",ro:"Partajează pe tumblr",ru:"Поделиться на tumblr",sk:"Zdieľať na tumblr",sl:"Deli na tumblr",sr:"Podeli na tumblr-u",sv:"Dela på tumblr",tr:"tumblr'ta paylaş",zh:"在tumblr上分享"},shareUrl:"http://tumblr.com/widgets/share/tool?canonicalUrl="+encodeURIComponent(e.getURL())+e.getReferrerTrack()}}},function(e,t,r){"use strict";var a=r(0),n=function(e,t){var r=document.createElement("div"),a=document.createTextNode(e);r.appendChild(a);var n=r.textContent;if(n.length<=t)return e;var i=n.substring(0,t-1).lastIndexOf(" ");return n=n.substring(0,i)+"…"};e.exports=function(e){var t=a.parse("https://twitter.com/intent/tweet",!0),r=e.getTitle();return t.query.text=n(r,120),t.query.url=e.getURL(),null!==e.options.twitterVia&&(t.query.via=e.options.twitterVia),delete t.search,{popup:!0,shareText:{en:"tweet",ja:"のつぶやき",ko:"짹짹",ru:"твит",sr:"твеет",zh:"鸣叫"},name:"twitter",faPrefix:"fab",faName:"fa-twitter",title:{bg:"Сподели в Twitter",cs:"Sdílet na Twiiteru",da:"Del på Twitter",de:"Bei Twitter teilen",en:"Share on Twitter",es:"Compartir en Twitter",fi:"Jaa Twitterissä",fr:"Partager sur Twitter",hr:"Podijelite na Twitteru",hu:"Megosztás Twitteren",it:"Condividi su Twitter",ja:"ツイッター上で共有",ko:"트위터에서 공유하기",nl:"Delen op Twitter",no:"Del på Twitter",pl:"Udostępnij na Twitterze",pt:"Compartilhar no Twitter",ro:"Partajează pe Twitter",ru:"Поделиться на Twitter",sk:"Zdieľať na Twitteri",sl:"Deli na Twitterju",sr:"Podeli na Twitter-u",sv:"Dela på Twitter",tr:"Twitter'da paylaş",zh:"在Twitter上分享"},shareUrl:a.format(t)+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"vk",faPrefix:"fab",faName:"fa-vk",title:{bg:"Сподели във VK",cs:"Sdílet na VKu",da:"Del på VK",de:"Bei VK teilen",en:"Share on VK",es:"Compartir en VK",fi:"Jaa VKissa",fr:"Partager sur VK",hr:"Podijelite na VKu",hu:"Megosztás VKon",it:"Condividi su VK",ja:"フェイスブック上で共有",ko:"페이스북에서 공유하기",nl:"Delen op VK",no:"Del på VK",pl:"Udostępnij na VKu",pt:"Compartilhar no VK",ro:"Partajează pe VK",ru:"Поделиться на ВКонтакте",sk:"Zdieľať na VKu",sl:"Deli na VKu",sr:"Podeli na VK-u",sv:"Dela på VK",tr:"VK'ta paylaş",zh:"在VK上分享"},shareUrl:"https://vk.com/share.php?url="+encodeURIComponent(e.getURL())+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"weibo",faPrefix:"fab",faName:"fa-weibo",title:{bg:"Сподели в weibo",cs:"Sdílet na weibo",da:"Del på weibo",de:"Bei weibo teilen",en:"Share on weibo",es:"Compartir en weibo",fi:"Jaa weiboissä",fr:"Partager sur weibo",hr:"Podijelite na weibo",hu:"Megosztás weiboen",it:"Condividi su weibo",ja:"Weibo上で共有",ko:"Weibo에서 공유하기",nl:"Delen op weibo",no:"Del på weibo",pl:"Udostępnij przez weibo",pt:"Compartilhar no weibo",ro:"Partajează pe weibo",ru:"Поделиться на weibo",sk:"Zdieľať na weibo",sl:"Deli na weibo",sr:"Podeli na weibo-u",sv:"Dela på weibo",tr:"Weibo'ta paylaş",zh:"分享至新浪微博"},shareUrl:"http://service.weibo.com/share/share.php?url="+encodeURIComponent(e.getURL())+"&title="+e.getTitle()+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){var t=encodeURIComponent(e.getURL()),r=e.getTitle();return{popup:!1,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"whatsapp",faPrefix:"fab",faName:"fa-whatsapp",title:{bg:"Сподели в Whatsapp",cs:"Sdílet na Whatsappu",da:"Del på Whatsapp",de:"Bei Whatsapp teilen",en:"Share on Whatsapp",es:"Compartir en Whatsapp",fi:"Jaa WhatsAppissä",fr:"Partager sur Whatsapp",hr:"Podijelite na Whatsapp",hu:"Megosztás WhatsAppen",it:"Condividi su Whatsapp",ja:"Whatsapp上で共有",ko:"Whatsapp에서 공유하기",nl:"Delen op Whatsapp",no:"Del på Whatsapp",pl:"Udostępnij przez WhatsApp",pt:"Compartilhar no Whatsapp",ro:"Partajează pe Whatsapp",ru:"Поделиться на Whatsapp",sk:"Zdieľať na Whatsapp",sl:"Deli na Whatsapp",sr:"Podeli na WhatsApp-u",sv:"Dela på Whatsapp",tr:"Whatsapp'ta paylaş",zh:"在Whatsapp上分享"},shareUrl:"whatsapp://send?text="+encodeURIComponent(r)+"%20"+t+e.getReferrerTrack()}}},function(e,t,r){"use strict";e.exports=function(e){return{popup:!0,shareText:{bg:"cподеляне",cs:"sdílet",da:"del",de:"teilen",en:"share",es:"compartir",fi:"Jaa",fr:"partager",hr:"podijelite",hu:"megosztás",it:"condividi",ja:"共有",ko:"공유하기",nl:"delen",no:"del",pl:"udostępnij",pt:"compartilhar",ro:"partajează",ru:"поделиться",sk:"zdieľať",sl:"deli",sr:"podeli",sv:"dela",tr:"paylaş",zh:"分享"},name:"xing",faPrefix:"fab",faName:"fa-xing",title:{bg:"Сподели в XING",cs:"Sdílet na XINGu",da:"Del på XING",de:"Bei XING teilen",en:"Share on XING",es:"Compartir en XING",fi:"Jaa XINGissä",fr:"Partager sur XING",hr:"Podijelite na XING",hu:"Megosztás XINGen",it:"Condividi su XING",ja:"XING上で共有",ko:"XING에서 공유하기",nl:"Delen op XING",no:"Del på XING",pl:"Udostępnij przez XING",pt:"Compartilhar no XING",ro:"Partajează pe XING",ru:"Поделиться на XING",sk:"Zdieľať na XING",sl:"Deli na XING",sr:"Podeli na XING-u",sv:"Dela på XING",tr:"XING'ta paylaş",zh:"分享至XING"},shareUrl:"https://www.xing.com/spi/shares/new?url="+encodeURIComponent(e.getURL())+e.getReferrerTrack()}}}]);
$('#eol_payment_form').on('submit', function(){
    // Init vars
    var form = $(this), url = form.attr('action');

    // Clean amount
    if (typeof $('#amount').val() !== 'undefined') {
        $('#amount').val($('#amount').val().replace(",", "."));
    }
    // Send ajax request
    $.ajax({
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: form.serialize(),
        dataType: "json",
        type: 'POST',
        url: url
    }).done(function(data) {
        // Start checkout
        var checkout = new window.checkout(data.id, {locale: data.locale});
        checkout.init().then(function() {
            checkout.open();
            checkout.abort(function() {
                delete checkout;
            });
            checkout.success(function(data) {
                $.redirect(data.returnUrl, {data: data}, "POST");
            });
        }).catch(function(error) {
        });
    });

    return false;
});

// Custom validation
function isValid(elem,text) {
    elem.setCustomValidity('');
    if (!elem.checkValidity()) {
        elem.setCustomValidity(text);
    }
}
/*
jQuery Redirect v1.1.3
Copyright (c) 2013-2018 Miguel Galante
Copyright (c) 2011-2013 Nemanja Avramovic, www.avramovic.info
Licensed under CC BY-SA 4.0 License: http://creativecommons.org/licenses/by-sa/4.0/
This means everyone is allowed to:
Share - copy and redistribute the material in any medium or format
Adapt - remix, transform, and build upon the material for any purpose, even commercially.
Under following conditions:
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
*/
;(function ($) {
    'use strict';

    //Defaults configuration
    var defaults = {
        url: null,
        values: null,
        method: "POST",
        target: null,
        traditional: false,
        redirectTop: false
    };

    /**
     * jQuery Redirect
     * @param {string} url - Url of the redirection
     * @param {Object} values - (optional) An object with the data to send. If not present will look for values as QueryString in the target url.
     * @param {string} method - (optional) The HTTP verb can be GET or POST (defaults to POST)
     * @param {string} target - (optional) The target of the form. "_blank" will open the url in a new window.
     * @param {boolean} traditional - (optional) This provides the same function as jquery's ajax function. The brackets are omitted on the field name if its an array.  This allows arrays to work with MVC.net among others.
     * @param {boolean} redirectTop - (optional) If its called from a iframe, force to navigate the top window.
     *//**
     * jQuery Redirect
     * @param {string} opts - Options object
     * @param {string} opts.url - Url of the redirection
     * @param {Object} opts.values - (optional) An object with the data to send. If not present will look for values as QueryString in the target url.
     * @param {string} opts.method - (optional) The HTTP verb can be GET or POST (defaults to POST)
     * @param {string} opts.target - (optional) The target of the form. "_blank" will open the url in a new window.
     * @param {boolean} opts.traditional - (optional) This provides the same function as jquery's ajax function. The brackets are omitted on the field name if its an array.  This allows arrays to work with MVC.net among others.
     * @param {boolean} opts.redirectTop - (optional) If its called from a iframe, force to navigate the top window.
     */
    $.redirect = function (url, values, method, target, traditional, redirectTop) {
        var opts = url;
        if (typeof url !== "object") {
            var opts = {
                url: url,
                values: values,
                method: method,
                target: target,
                traditional: traditional,
                redirectTop: redirectTop
            };
        }

        var config = $.extend({}, defaults, opts);
        var generatedForm = $.redirect.getForm(config.url, config.values, config.method, config.target, config.traditional);
        $('body', config.redirectTop ? window.top.document : undefined).append(generatedForm.form);
        generatedForm.submit();
        generatedForm.form.remove();
    };

    $.redirect.getForm = function (url, values, method, target, traditional) {
        method = (method && ["GET", "POST", "PUT", "DELETE"].indexOf(method.toUpperCase()) !== -1) ? method.toUpperCase() : 'POST';

        url = url.split("#");
        var hash = url[1] ? ("#" + url[1]) : "";
        url = url[0];

        if (!values) {
            var obj = $.parseUrl(url);
            url = obj.url;
            values = obj.params;
        }

        values = removeNulls(values);

        var form = $('<form>')
            .attr("method", method)
            .attr("action", url + hash);


        if (target) {
            form.attr("target", target);
        }

        var submit = form[0].submit;
        iterateValues(values, [], form, null, traditional);

        return { form: form, submit: function () { submit.call(form[0]); } };
    }

    //Utility Functions
    /**
     * Url and QueryString Parser.
     * @param {string} url - a Url to parse.
     * @returns {object} an object with the parsed url with the following structure {url: URL, params:{ KEY: VALUE }}
     */
    $.parseUrl = function (url) {

        if (url.indexOf('?') === -1) {
            return {
                url: url,
                params: {}
            };
        }
        var parts = url.split('?'),
            query_string = parts[1],
            elems = query_string.split('&');
        url = parts[0];

        var i, pair, obj = {};
        for (i = 0; i < elems.length; i += 1) {
            pair = elems[i].split('=');
            obj[pair[0]] = pair[1];
        }

        return {
            url: url,
            params: obj
        };
    };

    //Private Functions
    var getInput = function (name, value, parent, array, traditional) {
        var parentString;
        if (parent.length > 0) {
            parentString = parent[0];
            var i;
            for (i = 1; i < parent.length; i += 1) {
                parentString += "[" + parent[i] + "]";
            }

            if (array) {
                if (traditional)
                    name = parentString;
                else
                    name = parentString + "[" + name + "]";
            } else {
                name = parentString + "[" + name + "]";
            }
        }

        return $("<input>").attr("type", "hidden")
            .attr("name", name)
            .attr("value", value);
    };

    var iterateValues = function (values, parent, form, isArray, traditional) {
        var i, iterateParent = [];
        Object.keys(values).forEach(function (i) {
            if (typeof values[i] === "object") {
                iterateParent = parent.slice();
                iterateParent.push(i);
                iterateValues(values[i], iterateParent, form, Array.isArray(values[i]), traditional);
            } else {
                form.append(getInput(i, values[i], parent, isArray, traditional));
            }
        });
    };

    var removeNulls = function (values) {
        var propNames = Object.getOwnPropertyNames(values);
        for (var i = 0; i < propNames.length; i++) {
            var propName = propNames[i];
            if (values[propName] === null || values[propName] === undefined) {
                delete values[propName];
            } else if (typeof values[propName] === 'object') {
                values[propName] = removeNulls(values[propName]);
            } else if (values[propName].length < 1) {
                delete values[propName];
            }
        }
        return values;
    };
}(window.jQuery || window.Zepto || window.jqlite));

$('.gi-chart-germany *[data-modal="1"]').on('click',function (){
 var parentContainer = $(this).closest('.gi-chart-germany');
 openMapInfobox($(this).data('target'),parentContainer);
});

function showMapParts(elem) {
 var paths = elem.find('path');
 var delay = 0;
 if (checkIfVisible(elem)) {
  $(paths).each(function(){
   $(this).fadeIn(delay);
   delay += 200;
  });
 }
}

function checkIfVisible(elm) {
 var vpHeight = $(window).height(),
     scrollTop = $(window).scrollTop(),
     offSet = $(elm).offset().top,
     elementHeight = $(elm).height();
 return ((offSet < (vpHeight + scrollTop)) && (offSet > (scrollTop - elementHeight)));
}

function checkMaps(){
 $('.gi-chart-germany').each(function (){
  showMapParts($(this));
 });
}

function openMapInfobox(state,container) {
 $('.modal.show').modal('hide');
 var modalObject = container.find('.map-info-'+state);
 if (modalObject.data('link')){
  window.location.href = modalObject.data('link');
  return;
 }
 if (modalObject.length !== 0) {
  var fullOffset = modalObject.height();
  var offset = fullOffset/2 - 20;
  modalObject.css('top', (event.layerY-offset)+'px');
  modalObject.modal({
   backdrop: false
  },'show');
  jQuery('html, body').animate({
   scrollTop: (event.pageY-fullOffset) + 'px'
  }, 'slow');
 }
}

document.addEventListener('DOMContentLoaded', function () {
 checkMaps();
});

document.addEventListener('scroll', function(e) {
 checkMaps();
});

//check maps inside boostrap tab
$('body').on('shown.bs.tab', function (event) {
 checkMaps();
});
//check maps inside boostrap collaps
$('body').on('shown.bs.collapse', function (event) {
 checkMaps();
});



var map = $(".gi-campaign").find("#map");

if(map.length === 1) {
    console.log(map.data('url'));
    $.ajax({
        url: map.data('url'),

        // erfolgreich
        success: function(data, textStatus, jqXHR) {

            var obj = JSON.parse(data);
            var coordinates = [];
            var projectData = [];

            for (var i = 0, len = obj.length; i < len; i++) {
                var orgFlag = 'yellowIcon';

                if(obj[i]["organisation"] === false) {
                    orgFlag = 'blueIcon';
                }

                var title = obj[i]["title"];
                var text = '';

                if (obj[i]["type"] === 'city') {

                    orgFlag = 'purpleIcon';

                    title = obj[i]["title"];
                    text = '<b>'+title+'</b>';

                    $.each(obj[i]["users"], function() {
                        text = text+'<br><a href="'+this['url']+'">'+this['name']+'</a>';
                    });

                } else {
                    if(obj[i]["type"]){
                        text = '<strong>' + obj[i]["type"] + '</strong><br>';
                    }
                    text += title;
                    if (obj[i]["url"]){
                        text += '<br>&raquo; <a href="'+obj[i]["url"]+'">'+$(".gi-campaign").find("#map").data('linktext')+'</a>';
                    }
                }
                coordinates = [text,parseFloat(obj[i]["latitude"]),parseFloat(obj[i]["longitude"]),orgFlag,obj[i]["icon"]];
                projectData.push(coordinates);
            }

            showMap(projectData);
        },
        // nicht erfolgreich
        error: function(jqXHR, textStatus, errorThrown) {
            console.log("Error" + textStatus);
        }
    });
}

function showMap(projectData) {
    var blueIcon = new L.Icon({
      iconUrl: '/typo3conf/ext/gi_campaign/Resources/Public/Img/marker-blue.svg',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    var yellowIcon = new L.Icon({
      iconUrl: '/typo3conf/ext/gi_campaign/Resources/Public/Img/marker-yellow.svg',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    var purpleIcon = new L.Icon({
        iconUrl: '/typo3conf/ext/gi_campaign/Resources/Public/Img/marker-purple.svg',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var map = L.map('map').setView([51.1642292, 10.4541194], 6);
    var mapLink =
      '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 18,
      }).addTo(map);

    for (var i = 0; i < projectData.length; i++) {
        var marker = new L.marker([projectData[i][1], projectData[i][2]], {icon: yellowIcon}).bindPopup(projectData[i][0]).addTo(map);
        if (projectData[i][3] === 'blueIcon') {
            marker = new L.marker([projectData[i][1], projectData[i][2]], {icon: blueIcon}).bindPopup(projectData[i][0]).addTo(map);
        } else if (projectData[i][3] === 'purpleIcon') {
            marker = new L.marker([projectData[i][1], projectData[i][2]], {icon: purpleIcon}).bindPopup(projectData[i][0]).addTo(map);
        }

        //when custom icon is set use the custom icon
        if(projectData[i][4]){
            //console.log(projectData[i][4]);
            var icon = new L.Icon({
                iconUrl: projectData[i][4]['path'],
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            marker = new L.marker([projectData[i][1], projectData[i][2]], {icon: icon}).bindPopup(projectData[i][0]).addTo(map);
        }
    }
}

function getHashFilter() {
    var hash = location.hash;
    var matches = location.hash.match( /filter=([^&]+)/i );
    var hashFilter = matches && matches[1];
    return hashFilter && decodeURIComponent( hashFilter );
}

function chooseFilter() {
    var filter = getHashFilter();
    $('button.cat-none').click();
    $('button.cat-'+filter+'').click();
}

$(document).ready(function() {
    chooseFilter();
});

$(window).on( 'hashchange', chooseFilter );