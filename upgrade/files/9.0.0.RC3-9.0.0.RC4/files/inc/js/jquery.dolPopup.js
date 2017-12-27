/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

(function($) {

    $.fn.dolPopupDefaultOptions = {
        parent: 'body', // parent element selector
        closeOnOuterClick: true,
        closeElement: '.bx-popup-element-close', // link to element which will close popup
        position: 'centered', // | 'absolute' | 'fixed' | event | element,
        fog: {color: '#fff', opacity: .7}, // {color, opacity},
        pointer: false, // {el:(string_id|jquery_object), align: (left|right|center)},
        left: 0, // only for fixed or absolute
        top: 0, // only for fixed
        bottom: 'auto', // only for fixed or absolute
        moveToDocRoot: true,
        onBeforeShow: function () {},
        onShow: function () {},
        onBeforeHide: function () {},
        onHide: function () {},
        speed: 200
    }; 

    $.fn.dolPopupDefaultPointerOptions = {
        align: 'right',
        offset: '0 0',
        offset_pointer: '0 0'
    }; 

    $.fn.dolPopupCenter = function () {
        var dy = $(window).height() > $(this).outerHeight() ? ($(window).height() - $(this).outerHeight()) / 2 : 0;
        var dx = $(window).width() > $(this).outerWidth() ? ($(window).width() - $(this).outerWidth()) / 2 : 0;
        this.css("position","absolute");        
        this.css("top", Math.max(0, dy + $(window).scrollTop()) + "px");
        this.css("left", Math.max(0, dx + $(window).scrollLeft()) + "px");
        return this;
    }

    function _getScrollbarWidth () {
        if ($(document.body).height() <= $(window).height()) {
            return 0;
        }

        var outer = document.createElement("div"),
            inner = document.createElement("div"),
            widthNoScroll,
            widthWithScroll;

        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        document.body.appendChild(outer);

        widthNoScroll = outer.offsetWidth;

        // Force scrollbars
        outer.style.overflow = "scroll";

        // Add innerdiv
        inner.style.width = "100%";
        outer.appendChild(inner);

        widthWithScroll = inner.offsetWidth;

        // Remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    };

    function _dolPopupLockScreen (bLock) {
        var eBody = $(document.body),
            eBodyHtml = $("html, body"),
            iPaddingRight = parseInt(eBody.css("padding-right")) + ((bLock ? 1 : -1) * _getScrollbarWidth());

        eBody.css("padding-right", iPaddingRight + "px");
        bLock ? eBodyHtml.addClass('bx-popup-lock') : eBodyHtml.removeClass('bx-popup-lock');
    };

    $.fn.dolPopup = function(options) {
        var $this = this;
        var options = options || {};
        var o = $.extend({}, $.fn.dolPopupDefaultOptions, options);

        if (false != o.pointer) {
            o.fog = false;
            o.pointer = $.extend({}, $.fn.dolPopupDefaultPointerOptions, $(document).data('bx-popup-options') ? $(document).data('bx-popup-options') : {}, o.pointer);
        }

        if (o.fog && !$('#bx-popup-fog').length) {
            $('<div id="bx-popup-fog" class="bx-def-z-index-overlay" style="display: none;">&nbsp;</div>')
                .prependTo('body');
        }

        $('#bx-popup-fog').css({
            position: 'fixed',
            top: 0,
            left: 0,
            width: $(window).width(),
            height: $(window).height(),
            opacity: o.fog.opacity,
            backgroundColor: o.fog.color,
            '-webkit-backface-visibility': 'hidden'
        });
        
        $(window).on('resize.popupFog', function () {
            $('#bx-popup-fog').css({
                width: $(window).width(),
                height: $(window).height()
            });
        }).on('keyup.popup', function(oEvent) {
            if(o.closeOnOuterClick && oEvent.which == 27)
                $this.dolPopupHide();
        });

        return this.each(function() {
            var $el = $(this);

            $el.addClass('bx-def-z-index-modal bx-popup-responsive');

            // element must have id
            if (!$el.attr('id'))
                return false;

            if ($el.is(":visible")) { // if popup is shown - hide it
                $el.dolPopupHide();
                return true;
            } 

            if (false != o.pointer)
                $el.addClass('bx-popup-with-pointer'); // to make all popups with pointer not responsive add: .removeClass('bx-popup-responsive')

            // default style for correct positioning
            $el.css({
                display: 'block',
                visibility: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0
            });

            if (o.moveToDocRoot)
                $el.detach().appendTo('body');

            setTimeout(function() { // timeout is needed for some browsers to render element

                if (o.fog)
                    _dolPopupLockScreen(true);

                // remove any transitions before setting popup position
                $el.removeClass('bx-popup-transitions bx-popup-inactive'); 

                // set popup position
                $el._dolPopupSetPosition(o);

                if (!$el.hasClass('bx-popup-applied')) { // do this only once
                    $el.addClass('bx-popup-applied');

                    // save options for element
                    $el.data('bx-popup-options', o);

                    // attach event for "close element"
                    if (o.closeElement) {
                        $(o.closeElement, $el)
                            .css('cursor', 'hand')
                            .click(function() {
                                $el.dolPopupHide();
                            });
                    }

                    // attach event for outer click checking
                    if (o.closeOnOuterClick) {
                        var fCallback = function(e) {
                            if ($el.hasClass('bx-popup-applied') && $el.is(':visible')) {
                                if ($(e.target).parents('#' + $el.attr('id')).length == 0) {
                                    $el.dolPopupHide();
                                }
                            }

                            return true;
                        }

                        $(document).on({
                            click: fCallback,
                            touchend: fCallback
                        });
                    }
                }

                if(typeof(o.onBeforeShow) == 'function')
                	o.onBeforeShow($el);
                else if(typeof(o.onBeforeShow) == 'string')
                	eval(o.onBeforeShow);

                // transition effect
                if (o.moveToDocRoot) { 
                    // we need to disable classes with "max-height:100%", since popup isn't in the root element, so animation will not work when moveToDocRoot option is set 
                    $el.addClass('bx-popup-inactive');
                    setTimeout(function () {
                        $el.addClass('bx-popup-transitions bx-popup-active');
                    }, 10);
                }

                // Don't should popup with pointer if there is no parent. Checking before showing. 
                if($(o.pointer.el).length > 0 && !$.contains(document, o.pointer.el[0])) {
            		$el.remove();
            		return;
                }

                // show popup
                $el.css({display: 'block', visibility: 'visible'});
                if (o.fog) {
                	var oOnHide = function() {
                		$(window).triggerHandler('resize.popupFog');
                	};
                	
                    if (o.speed > 0)
                        $('#bx-popup-fog').fadeIn(o.speed, oOnHide);
                    else
                        $('#bx-popup-fog').show(oOnHide);
                }

                setTimeout(function () {
                	// Don't should popup with pointer if there is no parent. Checking after showing.
                	if($(o.pointer.el).length > 0 && !$.contains(document, o.pointer.el[0])) {
                		$el.remove();
                		return;
                	}

                	if(typeof(o.onShow) == 'function')
                		o.onShow($el);
                    else if(typeof(o.onShow) == 'string')
                    	eval(o.onShow);

                    $el.find('input[type=text]:first').focus(); // put cursor to the first input element
                }, o.speed);

            }, 100);
        });
    };

    $.fn.dolPopupInline = function(oOptionsCustom) {
    	if(typeof(oOptionsCustom) == 'undefined' || typeof(oOptionsCustom) != 'object')
            oOptionsCustom = {};

    	var oOptionsTotal = $.extend({}, oOptionsCustom, {
        	position: 'fixed',
        	top: '0px',
        	fog: false,
        	closeElement: '.bx-popup-close',
        	onBeforeShow: function(oPopup) {
        		if(typeof(oOptionsCustom.onBeforeShow) == 'function')
        			oOptionsCustom.onBeforeShow(oPopup);

        		$('body').addClass('bx-popup-inline-holder');
        	},
        	onBeforeHide: function(oPopup) {
        		if(typeof(oOptionsCustom.onBeforeHide) == 'function')
        			oOptionsCustom.onBeforeHide(oPopup);

        		$('body').removeClass('bx-popup-inline-holder');
        	},
        	onHide: function(oPopup) {
        		if(typeof(oOptionsCustom.onHide) == 'function')
        			oOptionsCustom.onHide(oPopup);

        		if(oOptionsCustom.removeOnClose == true)
        			$(oPopup).remove();
        	}
        });

    	return this.each(function() {
    		$(this).addClass('bx-popup-inline').dolPopup(oOptionsTotal);
    	});
    };

    $.fn.dolPopupHide = function(options) { 

        if ('undefined' == typeof(options) || 'object' != typeof(options))
            options = {};

        return this.each(function() {
            var $el = $(this);

            if (!$el.hasClass('bx-popup-applied'))
                return false;

            if (!$el.is(':visible') || 'hidden' == $el.css('visibility') || 'none' == $el.css('display'))
                return false;            

            var o = $.extend({}, $el.data('bx-popup-options'), options);

            if (!o)
                return false;

            $(window).off('resize.popupWindow');
            $(window).off('resize.popupPointer');
            $(window).off('resize.popupFog');
            $(window).off('keyup.popup');

            if(typeof(o.onBeforeHide) == 'function')
            	o.onBeforeHide($el);
            else if(typeof(o.onBeforeHide) == 'string')
            	eval(o.onBeforeHide);

            $el.removeClass('bx-popup-active').addClass('bx-popup-inactive');

            var onHide = null;
            if(typeof(o.onHide) == 'function')
            	onHide = o.onHide;
            else if(typeof(o.onHide) == 'string')
            	onHide = function(oPopup) {
            		eval(o.onHide);
            	};

            if (o.speed > 0) {

                if (o.fog)
                    $('#bx-popup-fog').fadeOut(o.speed);

                setTimeout(function () {
                    $el.hide();

                    if(typeof(onHide) == 'function')
                    	onHide($el);

                }, o.speed);

            } else {

                if (o.fog)
                    $('#bx-popup-fog').hide();

                $el.hide(function() {
                	if(typeof(onHide) == 'function')
                    	onHide($el);
                });
            }
            
            _dolPopupLockScreen(false);
        });
    };


    $.fn.dolPopupAjax = function(options) { 
        options = options || {};
        options = $.extend({}, $.fn.dolPopupDefaultOptions, options);

        if ('undefined' == typeof(options.url))
            return;

        if ('undefined' == typeof(options.container))
            options.container = '.bx-popup-content-wrapped';

        var bx_menu_on = function (e, b) {
            var li = $(e).parents('li:first');   
            if (!li.length)
                return;
            if (b) {
                var ul = $(e).parents('ul:first');   
                ul.find('li').removeClass('bx-menu-tab-active');
                li.addClass('bx-menu-tab-active');
            } else {
                li.removeClass('bx-menu-tab-active');
            }
        }

        var bx_menu_is_on = function (e) {    
            var li = $(e).parents('li:first');   
            if (!li.length)
                return false;
            return li.hasClass('bx-menu-tab-active');
        }

        return this.each(function() {
            var e = $(this);

            // get id
            var sPopupId = '';
            var sIdPrefix = 'bx-popup-ajax-wrapper-';
            if(typeof(e.attr('bx-popup-id')) != 'undefined')
            	sPopupId = sIdPrefix + e.attr('bx-popup-id');
            else if(typeof(options.id) != 'undefined')
            	switch(typeof(options.id)) {
            		case 'string':
            			sPopupId = sIdPrefix + options.id;
            			break;

            		case 'object':
            			sPopupId = typeof(options.id.force) != 'undefined' && options.id.force ? options.id.value : sIdPrefix + options.id.value;
            			break;
            	}
            else
            	sPopupId = sIdPrefix + parseInt(2147483647 * Math.random());

            var oPointerOptions = $.isWindow(e[0]) ? false : $.extend({}, {el:$(e), align:'center'}, options.pointer);
            if ($('#' + sPopupId + ':visible').length) { // if popup exists and is shown - hide it
                
                $('#' + sPopupId).dolPopupHide();

            } else if ($('#' + sPopupId).length) { // if popup exists but not shown - unhide it

                if (!$.isWindow(e[0]))
                    bx_menu_on(e, true);

                $('#' + sPopupId).dolPopup($.extend({}, options, {
                    pointer: oPointerOptions,
                    onHide: function () {
                        if (!$.isWindow(e[0]))
                            bx_menu_on(e, false);
                    }
                }));

            } else { // if popup doesn't exists - create new one from provided url

                if (!$.isWindow(e[0]))
                    bx_menu_on(e, true);

                $('<div id="' + sPopupId + '" style="display:none;">' + $('#bx-popup-loading').html() + '</div>').appendTo(options.parent).find(options.container).hide();

                $('#' + sPopupId).addClass($('#bx-popup-loading').attr('class'));

                var oLoading = $('#' + sPopupId + ' .bx-popup-loading-wrapped');
                bx_loading_content(oLoading, true, true);

                $('#' + sPopupId).dolPopup($.extend({}, options, {
                    pointer: oPointerOptions,
                    onHide: function () {
                        if (!$.isWindow(e[0]))
                            bx_menu_on(e, false);
                    }
                }));

                var fOnLoad = function() {
                	bx_loading_content(oLoading, false);

                	$('#' + sPopupId + ' ' + options.container).bxTime().show();

					$('#' + sPopupId)._dolPopupSetPosition({
						pointer: oPointerOptions
					});
                };

                var sUrl = (options.url.indexOf('http://') == 0 || options.url.indexOf('https://') == 0 || options.url.indexOf('/') == 0 ? '' : sUrlRoot) + options.url;

                $('#' + sPopupId).find(options.container).load(sUrl, function () {
                    var f = function () {
                    	if($('#' + sPopupId).find('img').length > 0 && !$('#' + sPopupId).find('img').get(0).complete)
                    	
                    		$('#' + sPopupId).find('img').load(fOnLoad);
                    	else
                    		fOnLoad();
                    };
                    setTimeout(f, 100); // TODO: better way is to check if item is animating before positioning it in the code where popup is positioning
                });
            }
        });
    };


    $.fn.dolPopupImage = function(sUrl, sLoadingElement) {

        return this.each(function() {

            var ePopup = $(this);
            var k = .97,
                w = $(window).width(),
                h = $(window).height(),
                eImg = new Image();

            if (!ePopup.find('img').size())
                return;

            ePopup.filter('.bx-popup-wrapper').addClass('bx-popup-image-wrapper');

            eImg.src = sUrl;

            if ('undefined' != typeof(sLoadingElement))
                bx_loading (sLoadingElement, true);

            $(eImg).on('load', function () {

                var ri = eImg.width / eImg.height;
                var rs = w/h;

                if ('undefined' != typeof(sLoadingElement))
                    bx_loading (sLoadingElement, false);

                ePopup.find('img').attr('src', sUrl);

                if ('undefined' != typeof(window.matchMedia) && window.matchMedia("(max-width:720px)").matches)
                    k = 1.0;

                // fit image into the browser window
                if (eImg.width < w * k && eImg.height < h * k) {
                    ePopup.find('img').css({
                        width: 'auto',
                        height: 'auto'
                    });
                }
                else {
                    ePopup.find('img').css({
                        width: rs > ri ? parseInt(k * eImg.width * h/eImg.height) + 'px' : 'auto',
                        height: rs > ri ? 'auto' : parseInt(k * eImg.height * w/eImg.width) + 'px',
                    }).addClass('bx-constrain-height');
                }
                
                // show popup
                ePopup.dolPopup();

                // hide popup upon clicking/tapping on the image
                var fCallback = function (e) {
                    e.stopPropagation();
                    ePopup.dolPopupHide();
                };
                ePopup.find('img').on({
                    click: fCallback,
                    touchend: fCallback
                });

            });
        });
    };

    $.fn.dolPopupAlert = function(options) {
    	var oAPopup = $('#bx-popup-alert');

    	if(options.message != undefined && options.message.length > 0)
    		oAPopup.find('.popup_alert_text').html(options.message);

    	oAPopup.find('.popup_alert_ok').bind('click', function() {
			if(options.onClickOk && typeof(options.onClickOk) == 'function')
				options.onClickOk(oAPopup);

			oAPopup.dolPopupHide();
		});

		var fOnHide = options.onHide;
		options.onHide = function(oPopup) {
			if(typeof(fOnHide) == 'function')
				fOnHide(oAPopup);

			oAPopup.find('.bx-btn').unbind('click');
		};

		oAPopup.dolPopup(options);
    };

    $.fn.dolPopupConfirm = function(options) {
    	var oCPopup = $('#bx-popup-confirm');

    	if(options.message != undefined && options.message.length > 0)
    		oCPopup.find('.popup_confirm_text').html(options.message);

    	oCPopup.find('.popup_confirm_yes').bind('click', function(event) {
            event.stopPropagation();

			if(options.onClickYes && typeof(options.onClickYes) == 'function')
				options.onClickYes(oCPopup);

			oCPopup.dolPopupHide();
		});

		oCPopup.find('.popup_confirm_no').bind('click', function(event) {
            event.stopPropagation();

			if (options.onClickNo && typeof(options.onClickNo) == 'function')
				options.onClickNo(oCPopup);

			oCPopup.dolPopupHide();
		});

		var fOnHide = options.onHide;
		options.onHide = function(oPopup) {
			if(typeof(fOnHide) == 'function')
				fOnHide(oCPopup);

			oCPopup.find('.bx-btn').unbind('click');
		};

		oCPopup.dolPopup(options);
    };

    $.fn.dolPopupPrompt = function(options) {
    	var oPPopup = $('#bx-popup-prompt');

    	oPPopup.setValue = function(mixedValue) {
    		return oPPopup.find('[name="bx-popup-prompt-value"]').val(mixedValue);
    	};

    	oPPopup.getValue = function() {
    		return oPPopup.find('[name="bx-popup-prompt-value"]').val();
    	};   		

    	if(options.message != undefined && options.message.length > 0)
    		oPPopup.find('.popup_prompt_text').html(options.message);

    	if(options.value != undefined && options.value.length > 0)
    		oPPopup.setValue(options.value);

    	oPPopup.find('.popup_prompt_ok').bind('click', function() {
			if(options.onClickOk && typeof(options.onClickOk) == 'function')
				options.onClickOk(oPPopup);

			oPPopup.dolPopupHide();
		});

		oPPopup.find('.popup_prompt_cancel').bind('click', function() {
			if(options.onClickCancel && typeof(options.onClickCancel) == 'function')
				options.onClickCancel(oPPopup);

			oPPopup.dolPopupHide();
		});

		var fOnHide = options.onHide;
		options.onHide = function(oPopup) {
			if(typeof(fOnHide) == 'function')
				fOnHide(oPPopup);

			oPPopup.setValue('');
			oPPopup.find('.bx-btn').unbind('click');
		};

		oPPopup.dolPopup(options);
    };

    $.fn._dolPopupSetPosition = function(options) {

        var o = $.extend({}, $.fn.dolPopupDefaultOptions, options);

        if (undefined != o.pointer && false != o.pointer)
            o.pointer = $.extend({}, $.fn.dolPopupDefaultPointerOptions, $(document).data('bx-popup-options') ? $(document).data('bx-popup-options') : {}, o.pointer);

        return this.each(function() {
            var $el = $(this);
            
            if (o.pointer != false) {                
                
                var yOffset = 3;
                var ePointAt = 'string' == o.pointer.el ? $(o.pointer.el) : o.pointer.el;
                if (!ePointAt)
                    ePointAt = $('body');

                var aOffset = ('' + o.pointer.offset).split(' ', 2);
                var aOffsetPointer = ('' + o.pointer.offset_pointer).split(' ', 2);
                if (undefined == aOffset[0] || undefined == aOffset[1])
                    aOffset = [0, 0];
                if (undefined == aOffsetPointer[0] || undefined == aOffsetPointer[1])
                    aOffsetPointer = [0, 0];

                $el.position({
                    of: ePointAt,
                    my: o.pointer.align + '+' + parseInt(aOffset[0]) + ' top+' + yOffset + '+' + parseInt(aOffset[1] - 0),
                    at: o.pointer.align + ' bottom',
                    collision: 'flip none'
                });

                $el.find('.bx-popup-box-pointer').css('display', 'block').position({
                    of: ePointAt,
                    my: 'center+' + (parseInt(aOffsetPointer[0]) + parseInt(aOffset[0])) + ' top+' + yOffset + '+' + (parseInt(aOffsetPointer[1]) + parseInt(aOffset[1]) + 0),
                    at: 'center bottom'
                });

                $(window).on('resize.popupPointer', function() {
                    $el.position({
                        of: ePointAt,
                        my: o.pointer.align + '+' + parseInt(aOffset[0]) + ' top+' + yOffset + '+' + parseInt(aOffset[1]),
                        at: o.pointer.align + ' bottom',
                        collision: 'flip none'
                    });
                });

            } else if (o.position == 'fixed' || o.position == 'absolute') {

                $el.css({
                    position: o.position,
                    left: o.left,
                    top: o.top,
                    bottom: o.bottom
                });

            } else if (o.position == 'centered') {

            	var oPosition = function(oElement) {
                    oElement.dolPopupCenter();
            	};

            	oPosition($el);

                // attach window resize event
                $(window).on('resize.popupWindow', function() {
                	oPosition($el);
                }).on('scroll', function() {
                	oPosition($el);
                });

            } else if (typeof o.position == 'object') {

                $el.position({
                    of: o.position,
                    my: 'center top',
                    at: 'center bottom',
                    collision: 'flip flip'
                });

            }
        });
    };

})(jQuery);

/** @} */