/*========================================================
 * 弹出框
 * =======================================================*/
// TODO F7有些方法没实现,暂时不需要
;
(function ($, window, document, undefined) {
    var modalStack = [];
    var _modalTemplateTempDiv = document.createElement('div');

    function modal(params) {
        params = params || {};
        var modalHTML = '';
        var buttonsHTML = '';
        if (params.buttons && params.buttons.length > 0) {
            for (var i = 0; i < params.buttons.length; i++) {
                buttonsHTML += '<span class="modal-button' + (params.buttons[i].bold ? ' modal-button-bold' : '') + '">' + params.buttons[i].text + '</span>';
            }
        }
        var titleHTML = params.title ? '<div class="modal-title">' + params.title + '</div>' : '';
        var textHTML = params.text ? '<div class="modal-text">' + params.text + '</div>' : '';
        var afterTextHTML = params.afterText ? params.afterText : '';
        var noButtons = !params.buttons || params.buttons.length === 0 ? 'modal-no-buttons' : '';
        var verticalButtons = params.verticalButtons ? 'modal-buttons-vertical' : '';
        modalHTML = '<div class="modal ' + noButtons + ' ' + (params.cssClass || '') + '"><div class="modal-inner">' + (titleHTML + textHTML + afterTextHTML) + '</div><div class="modal-buttons ' + verticalButtons + '">' + buttonsHTML + '</div></div>';
        _modalTemplateTempDiv.innerHTML = modalHTML;
        var modal = $(_modalTemplateTempDiv).children();
        $('body').append(modal[0]);
        // Add events on buttons
        modal.find('.modal-button').each(function (index, el) {
            $(el).on('click', function (e) {
                if (params.buttons[index].close !== false) closeModal(modal);
                if (params.buttons[index].onClick) params.buttons[index].onClick(modal, e);
                if (params.onClick) params.onClick(modal, index);
            });
        });
        openModal(modal);
        return modal;
    }

    function openModal(modal) {
        modal = $(modal);
        var isModal = modal.hasClass('modal');
        if ($('.modal.modal-in:not(.modal-out)').length && isModal) {
            modalStack.push(function () {
                openModal(modal);
            });
            return;
        }
        // do nothing if this modal already shown
        if (true === modal.data('f7-modal-shown')) {
            return;
        }
        modal.data('f7-modal-shown', true);
        modal.trigger('close', function () {
            modal.removeData('f7-modal-shown');
        });
        if (isModal) {
            modal.show();
            modal.css({
                marginTop: -Math.round(modal.outerHeight() / 2) + 'px'
            });
        }
        if ($('.modal-overlay').length === 0) {
            $('body').append('<div class="modal-overlay"></div>');
        }
        var overlay = $('.modal-overlay');
        //Make sure that styles are applied, trigger relayout;
        var clientLeft = modal[0].clientLeft;//这个不能删,删了actions动画没了.
        // Trugger open event
        modal.trigger('open');
        // Classes for transition in
        overlay.addClass('modal-overlay-visible');
        modal.removeClass('modal-out').addClass('modal-in').transitionEnd(function (e) {
            if (modal.hasClass('modal-out')) modal.trigger('closed');
            else modal.trigger('opened');
        });
        return true;
    }

    function closeModal(modal) {
        modal = $(modal || '.modal-in');
        if (typeof modal !== 'undefined' && modal.length === 0) {
            return;
        }
        var isModal = modal.hasClass('modal');
        var overlay = $('.modal-overlay');
        if (overlay && overlay.length > 0) {
            overlay.removeClass('modal-overlay-visible');
        }
        modal.trigger('close');
        modal.removeClass('modal-in').addClass('modal-out').transitionEnd(function (e) {
            if (modal.hasClass('modal-out')) modal.trigger('closed');
            else modal.trigger('opened');
            modal.remove();
        });
        if (isModal) {
            modalStackClearQueue();
        }
        return true;
    }

    function modalStackClearQueue() {
        if (modalStack.length) {
            (modalStack.shift())();
        }
    }

    var modalTitle = 'Tooltip';
    var modalButtonOk = 'OK';
    var modalButtonCancel = 'Cancel';
    var modalPreloaderTitle = 'Loading';
    $.extend({
        prompt: function (value, title, callbackOk, callbackCancel) {
            if (arguments.length === 2) {
                callbackOk = arguments[1];
                title = arguments[0];
                value = '';
            }
            var m = modal({
                text: '<input class="modal-input" value="'+value+'"/>',
                title: typeof title === 'undefined' ? modalTitle : title,
                buttons: [
                    {text: modalButtonCancel, onClick: callbackCancel},
                    {text: modalButtonOk, bold: true, onClick: function(){
                        var value = $('.modal-input').val();
                        callbackOk && callbackOk(value);
                    }}
                ]
            });
            m.on('opened', function(){
                var $input = $('.modal-input');
                $input.focus();
                var input = $input.get(0);
                var value = $input.val();
                var valueLength = value ? value.length : 0;
                input.setSelectionRange && input.setSelectionRange(valueLength,valueLength);
            });
            return m;
        },
        alert: function (text, title, callbackOk) {
            if (typeof title === 'function') {
                callbackOk = arguments[1];
                title = undefined;
            }
            return modal({
                text: text || '',
                title: typeof title === 'undefined' ? modalTitle : title,
                buttons: [
                    {text: modalButtonOk, bold: true, onClick: callbackOk}
                ]
            });
        },
        confirm: function (text, title, callbackOk, callbackCancel) {
            if (typeof title === 'function') {
                callbackCancel = arguments[2];
                callbackOk = arguments[1];
                title = undefined;
            }
            return modal({
                text: text || '',
                title: typeof title === 'undefined' ? modalTitle : title,
                buttons: [
                    {text: modalButtonCancel, onClick: callbackCancel},
                    {text: modalButtonOk, bold: true, onClick: callbackOk}
                ]
            });
        },
        showPreloader: function (title) {
            return modal({
                title: title || modalPreloaderTitle,
                text: '<div class="preloader"></div>',
                cssClass: 'modal-preloader'
            });
        },
        hidePreloader: function () {
            closeModal('.modal.modal-in');
        },
        showIndicator: function () {
            //$('body').append('<div class="preloader-indicator-overlay"></div><div class="preloader-indicator-modal"><span class="preloader preloader-white"></span></div>');
            //去掉全屏透明遮盖层
            $('body').append('<div class="preloader-indicator-modal"><span class="preloader preloader-white"></span></div>');
        },
        hideIndicator: function () {
            $('.preloader-indicator-overlay, .preloader-indicator-modal').remove();
        },
        toast: function (text, during, closeCallBack) {

            if (typeof during === 'function') {
                closeCallBack = arguments[1];
                during = undefined;
            }

            if (!during) {
                during = 1500;
            }

            var m = modal({
                title: '',
                text: text
            });
            if (closeCallBack) {
                m.on("close", closeCallBack);
            }
            setTimeout(function () {
                closeModal();
            }, during);
            return modal
        },
        actions: function (params) {
            var modal, groupSelector, buttonSelector;
            params = params || [];
            if (params.length > 0 && !$.isArray(params[0])) {
                params = [params];
            }
            var modalHTML;
            var buttonsHTML = '';
            for (var i = 0; i < params.length; i++) {
                for (var j = 0; j < params[i].length; j++) {
                    if (j === 0) buttonsHTML += '<div class="actions-modal-group">';
                    var button = params[i][j];
                    var buttonClass = button.label ? 'actions-modal-label' : 'actions-modal-button';
                    if (button.bold) buttonClass += ' actions-modal-button-bold';
                    if (button.color) buttonClass += ' color-' + button.color;
                    if (button.bg) buttonClass += ' bg-' + button.bg;
                    if (button.disabled) buttonClass += ' disabled';
                    buttonsHTML += '<div class="' + buttonClass + '">' + button.text + '</div>';
                    if (j === params[i].length - 1) buttonsHTML += '</div>';
                }
            }
            modalHTML = '<div class="actions-modal">' + buttonsHTML + '</div>';
            _modalTemplateTempDiv.innerHTML = modalHTML;
            modal = $(_modalTemplateTempDiv).children();
            $('body').append(modal[0]);
            groupSelector = '.actions-modal-group';
            buttonSelector = '.actions-modal-button';
            var groups = modal.find(groupSelector);
            groups.each(function (index, el) {
                var groupIndex = index;
                $(el).children().each(function (index, el) {
                    var buttonIndex = index;
                    var buttonParams = params[groupIndex][buttonIndex];
                    var clickTarget;
                    if ($(el).is(buttonSelector)) clickTarget = $(el);
                    if ($(el).find(buttonSelector).length > 0) clickTarget = $(el).find(buttonSelector);
                    if (clickTarget) {
                        clickTarget.on('click', function (e) {
                            if (buttonParams.close !== false) closeModal(modal);
                            if (buttonParams.onClick) buttonParams.onClick(modal, e);
                        });
                    }
                });
            });
            openModal(modal);
            return modal;
        },
        closeModal: closeModal
    });
})(jQuery, window, document);


/*========================================================
 * 一些基础工具封装
 * =======================================================*/
$.extend({
    device: (function () {
        var device = {};
        var ua = navigator.userAgent;
        var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);

        device.ios = device.android = device.iphone = device.ipad = device.androidChrome = false;

        // Android
        if (android) {
            device.os = 'android';
            device.osVersion = android[2];
            device.android = true;
            device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
        }
        if (ipad || iphone || ipod) {
            device.os = 'ios';
            device.ios = true;
        }
        // iOS
        if (iphone && !ipod) {
            device.osVersion = iphone[2].replace(/_/g, '.');
            device.iphone = true;
        }
        if (ipad) {
            device.osVersion = ipad[2].replace(/_/g, '.');
            device.ipad = true;
        }
        if (ipod) {
            device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
            device.iphone = true;
        }
        // iOS 8+ changed UA
        if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
            if (device.osVersion.split('.')[0] === '10') {
                device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
            }
        }

        // Webview
        device.webView = (iphone || ipad || ipod) && ua.match(/.*AppleWebKit(?!.*Safari)/i);

        // Minimal UI
        if (device.os && device.os === 'ios') {
            var osVersionArr = device.osVersion.split('.');
            device.minimalUi = !device.webView &&
                (ipod || iphone) &&
                (osVersionArr[0] * 1 === 7 ? osVersionArr[1] * 1 >= 1 : osVersionArr[0] * 1 > 7) &&
                $('meta[name="viewport"]').length > 0 && $('meta[name="viewport"]').attr('content').indexOf('minimal-ui') >= 0;
        }

        // Check for status bar and fullscreen app mode
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        device.statusBar = false;
        if (device.webView && (windowWidth * windowHeight === screen.width * screen.height)) {
            device.statusBar = true;
        } else {
            device.statusBar = false;
        }

        // Classes
        var classNames = [];

        // Pixel Ratio
        device.pixelRatio = window.devicePixelRatio || 1;
        classNames.push('pixel-ratio-' + Math.floor(device.pixelRatio));
        if (device.pixelRatio >= 2) {
            classNames.push('retina');
        }

        // OS classes
        if (device.os) {
            classNames.push(device.os, device.os + '-' + device.osVersion.split('.')[0], device.os + '-' + device.osVersion.replace(/\./g, '-'));
            if (device.os === 'ios') {
                var major = parseInt(device.osVersion.split('.')[0], 10);
                for (var i = major - 1; i >= 6; i--) {
                    classNames.push('ios-gt-' + i);
                }
            }

        }
        // Status bar classes
        if (device.statusBar) {
            classNames.push('with-statusbar-overlay');
        } else {
            $('html').removeClass('with-statusbar-overlay');
        }

        // Add html classes
        if (classNames.length > 0) $('html').addClass(classNames.join(' '));
        device.wx = ua.toLowerCase().indexOf('micromessenger') >= 0;
        // Export object
        return device;
    })()
});

$.extend({
    support: {
        touch: !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch)
    }
});
$.extend({
    touchEvents: {
        start: $.support.touch ? 'touchstart' : 'mousedown',
        move: $.support.touch ? 'touchmove' : 'mousemove',
        end: $.support.touch ? 'touchend' : 'mouseup'
    }
});
$.extend({
    compareVersion: function (a, b) {
        if (a === b) return 0;
        var as = a.split('.');
        var bs = b.split('.');
        for (var i = 0; i < as.length; i++) {
            var x = parseInt(as[i]);
            if (!bs[i]) return 1;
            var y = parseInt(bs[i]);
            if (x < y) return -1;
            if (x > y) return 1;
        }
        return 1;
    }
});

$.fn.transform = function (transform) {
    for (var i = 0; i < this.length; i++) {
        var elStyle = this[i].style;
        elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
    }
    return this;
};
$.fn.transition = function (duration) {
    if (typeof duration !== 'string') {
        duration = duration + 'ms';
    }
    for (var i = 0; i < this.length; i++) {
        var elStyle = this[i].style;
        elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration;
    }
    return this;
};
$.fn.transitionEnd = function (callback) {
    var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
        i, j, dom = this;

    function fireCallBack(e) {
        /*jshint validthis:true */
        if (e.target !== this) return;
        callback.call(this, e);
        for (i = 0; i < events.length; i++) {
            dom.off(events[i], fireCallBack);
        }
    }

    if (callback) {
        for (i = 0; i < events.length; i++) {
            dom.on(events[i], fireCallBack);
        }
    }
    return this;
};
$.fn.animationEnd = function (callback) {
    var events = ['webkitAnimationEnd', 'OAnimationEnd', 'MSAnimationEnd', 'animationend'],
        i, j, dom = this;

    function fireCallBack(e) {
        callback(e);
        for (i = 0; i < events.length; i++) {
            dom.off(events[i], fireCallBack);
        }
    }

    if (callback) {
        for (i = 0; i < events.length; i++) {
            dom.on(events[i], fireCallBack);
        }
    }
    return this;
};
