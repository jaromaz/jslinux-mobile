
/* ---------------------------------------------------------
    JSLinux by Fabrice Bellard https://bellard.org
    Mobile version by Jaromaz https://jm.iq.pl/jslinux-mobile
   --------------------------------------------------------- */


    function scrollTo(element, to, duration) {
	    var start = element.scrollTop,
	    change = to - start,
	    currentTime = 0,
	    increment = 20;
	            
	    var animateScroll = function(){        
	        currentTime += increment;
	        var val = Math.easeInOutQuad(currentTime, start, change, duration);
	        element.scrollTop = val;
	        if (currentTime < duration) {
	            setTimeout(animateScroll, increment);
	        }
	    };        
        animateScroll();
    }

    Math.easeInOutQuad = function (t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2*t*t + b;
	    t--;
	return -c/2 * (t*(t-2) - 1) + b;
    };

    function handleEvents(e) {  
	scrollTo(document.body, 0, 200);
    }

    document.addEventListener('touchstart', handleEvents, false);        
    document.addEventListener('touchmove', handleEvents, false);
    document.addEventListener('click', handleEvents, false);
    setInterval(handleEvents, 3000);

