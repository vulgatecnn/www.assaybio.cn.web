//--------coding by chenyan
//2012.4.26

(function($) {

jQuery.fn.extend({
	scrbarOn: function(scrH,scrSp) {	
		var _this=$(this);
		var scrCont,scrBox,scrPanel,btnBack,btnFord,scrZone,scrHand,isMouseOver,isMouseDrag,scrLineT,scrDisSize,scrHandSize,scrZoneSize,scrLineB,scrTar,scrCan,scrContSize,scrContSizeLast,scrTimer,scrInter;
		resetThis();
			
		function resetThis(){
			scrSp=scrSp||10;
			scrH=scrH||false;
			scrCont=_this.children(".scrCont");
			scrPanel=_this.children(".scrPanel");
			btnBack=scrPanel.children(".btnBack");
			btnFord=scrPanel.children(".btnFord");
			scrZone=scrPanel.children(".scrZone");
			scrHand=scrZone.children(".scrHand");
			scrPage=_this.find(".btnPage");
			scrBtnPrev=_this.find(".btnPrev");
			scrBtnNext=_this.find(".btnNext");	
			
			resizeFunc();
			scrInter=setInterval(scrListener,500);		
			
			_this.bind("scrFord",scrFordFunc);
			_this.bind("scrBack",scrBackFunc);
			_this.bind("scrPos",scrPosFunc);

			$(document).bind('mouseup',_this_mouseup);
			$(document).bind('mousemove',_this_mousemove);
			_this.bind('mousewheel',_this_mousewheel);
			_this.bind('mouseenter',_this_mouseenter);
			_this.bind('mouseleave',_this_mouseleave);
			_this[0].ontouchmove=scrZone_touchmove;
			scrZone.bind('mousedown',scrZone_mousedown);
			scrZone[0].ontouchmove=scrZone_touchmove;
			scrZone[0].ontouchstart=scrZone_touchstart;
			scrZone[0].ontouchend=scrZone_touchend;
			btnBack.bind('mousedown',btnBack_mousedown);
			btnBack[0].ontouchstart=btnBack_touchstart;
			btnBack[0].ontouchend=_this_mouseup;
			btnFord.bind('mousedown',btnFord_mousedown);
			btnFord[0].ontouchstart=btnFord_touchstart;
			btnFord[0].ontouchend=_this_mouseup;				
		}//end func	
		
		//-------------------------------初始化
		
		function resizeFunc(){
			scrContSizeFunc();
			scrContSizeLast=scrContSize;//滚动内容上一次高
			isMouseOver=false;
			isMouseDrag=false;
			scrTar=0;
			if(scrH){
				scrDisSize=_this.width();
				scrZone.css("width",_this.width()-btnBack.width()-btnFord.width());
				scrZoneSize=scrZone.width();
				scrHandSize=scrHand.width();
				scrCont.css("left",0);
				scrHand.css("left",0);
			}//end if scrH
			else{
				scrDisSize=_this.height();//可见区域高度
				scrZone.css("height",_this.height()-btnBack.height()-btnFord.height());
				scrZoneSize=scrZone.height();//可滑动高度
				scrHandSize=scrHand.height();
				scrCont.css("top",0);
				scrHand.css("top",0);	
			}//end else scrH
			scrLineT=scrHandSize/2;
			scrLineB=scrZoneSize-scrHandSize/2;	
			if(scrContSize<=scrDisSize){
				scrCan=false;
				scrPanel.hide();
			}//end if
			else{
				scrCan=true;
				scrPanel.show();
			}//end else		
		}//end func
		
		//-------------------------------各种条件判断
		
		
		function scrContSizeFunc(){
			if(scrH){
				scrBox=scrCont.children();
				scrContSize=0;
				for(var i=0; i<scrBox.length; i++){
					scrContSize+=scrBox.eq(i).outerWidth(true);
				}//end for
				scrCont.width(scrContSize);
			}//end if scrH
			else{
				scrContSize=scrCont.height();
			}//end else scrH	
		}//end func
		
		function scrListener(){
			scrContSizeFunc();
			if(scrContSizeLast!=scrContSize){
				scrContSizeLast=scrContSize;
				resizeFunc();
			}//end if
		}//end func
		
		//-------------------------------自定义事件
		

		function scrBackFunc(event){
			if(scrCan){
				scrTar-=scrSp;
				scrollFunc();
			}//end if
		}//end func
		function scrFordFunc(event){
			if(scrCan){
				scrTar+=scrSp;
				scrollFunc();
			}//end if
		}//end func
		function scrPosFunc(event,value){
			if(scrCan){
				scrTar=-value/(scrContSize-scrDisSize)*(scrZoneSize-scrHandSize)+scrLineT;
				if(scrH){
					scrCont.css("left",value);
					scrHand.css("left",scrTar-scrHandSize/2); 
				}//end if scrH
				else{
					scrCont.css("top",value);
					scrHand.css("top",scrTar-scrHandSize/2); 
				}//end else scrH					
			}//end if
		}//end func
		
		//-----------------TOUCH事件
		function scrZone_touchmove(event){
			event.preventDefault();
			if(scrH){
				scrTar=event.touches[0].clientX+$(window).scrollLeft()-scrZone.offset().left;
			}//end if scrH
			else{
				scrTar=event.touches[0].clientY+$(window).scrollTop()-scrZone.offset().top;
			}//end else scrH
			scrollFunc();
		}//end func
		function scrZone_touchstart(event){
			event.preventDefault();
			scrType=false;
			touchTop=scrZone.offset().top;
			if(scrH){
				scrTar=event.touches[0].clientX+$(window).scrollLeft()-scrZone.offset().left;
			}//end if scrH
			else{
				scrTar=event.touches[0].clientY+$(window).scrollTop()-scrZone.offset().top;
			}//end else scrH
			scrollFunc();
		}//end func
		function scrZone_touchend(event){
			event.preventDefault();
		}//end func
		
		function btnBack_touchstart(event){
			event.preventDefault();
			clearInterval(scrTimer);
			scrTimer=setInterval(function(){
				scrTar-=scrSp;
				scrollFunc();
			},60);	
		}//end func
		function btnFord_touchstart(event){
			event.preventDefault();
			clearInterval(scrTimer);
			scrTimer=setInterval(function(){
				scrTar+=scrSp;
				scrollFunc();
			},60);	
		}//end func
		
		//-------------------------------鼠标事件
		function _this_mousewheel(event, delta){
			if(scrCan){
				delta=delta/Math.abs(delta)*scrSp;
				scrTar-=delta;
				scrollFunc();
			}//end if 
		}//end func
		function scrbar_mousewheel(event){
			event.preventDefault();
		}//end func
		function _this_mouseup(){
			isMouseDrag=false;
			clearInterval(scrTimer);  
			mouseSelectOn();
		}//end func
		function _this_mouseenter(event){
			if(scrCan){
				isMouseOver=true;
				$(document).bind('mousewheel',scrbar_mousewheel);//阻止窗口默认行为发生
			}//end if  
		}//end func
		function _this_mouseleave(event){
			if(scrCan){
				isMouseOver=false;
				$(document).unbind('mousewheel',scrbar_mousewheel);//恢复窗口默认行为发生
			}//end if 
		}//end func
		function _this_mousemove(event){
			if(isMouseDrag){	
				if(scrH){
					scrTar=event.pageX-scrZone.offset().left;
				}//end if scrH
				else{
					scrTar=event.pageY-scrZone.offset().top;
				}//end else scrH
				scrollFunc();
				mouseSelectOff();
			}//end if
		}//end func
		function scrZone_mousedown(event){
			isMouseDrag=true;
			if(scrH){
				scrTar=event.pageX-scrZone.offset().left;
			}//end if scrH
			else{
				scrTar=event.pageY-scrZone.offset().top;
			}//end else scrH	
			scrollFunc();
			mouseSelectOff();
		}//end func
		function btnBack_mousedown(event){
			if(!isMouseDrag){ 
				clearInterval(scrTimer);
				scrTimer=setInterval(function(){
					scrTar-=scrSp;
					scrollFunc();
				},60);	
			}//end if	
			mouseSelectOff();
		}//end func
		function btnFord_mousedown(event){
			if(!isMouseDrag){ 
				clearInterval(scrTimer);
				scrTimer=setInterval(function(){
					scrTar+=scrSp;
					scrollFunc();
				},60);	
			}//end if	
			mouseSelectOff();
		}//end func
 	
		function mouseSelectOff(){
			document.onselectstart = function () { return false; };	//防止ie选取
			document.unselectable= "on";//防止OPERA选取
			_this.css({"-moz-user-select":"none"});//防止FIREFX选取
			$("body").css({"-webkit-user-select":"none"});//防止chrome选取发
		}//end func
		
		function mouseSelectOn(){
			document.onselectstart = function () { return true; };//允许IE选取
			document.unselectable= "off";//允许OPERA选取
			_this.css({"-moz-user-select":"elements"});//允许FIREFOX选取
			$("body").css({"-webkit-user-select":"text"});//允许CHROME选取
		}//end func			
		
		//-------------------------------运动计算部分	 
	   
		function scrollFunc(){
			scrCont.stop(true);
			scrIsMov=false;
			scrTar=scrTar>scrLineB?scrLineB:scrTar;
			scrTar=scrTar<scrLineT?scrLineT:scrTar;
			var pos=-(scrTar-scrLineT)/(scrZoneSize-scrHandSize)*(scrContSize-scrDisSize);
			if(scrH){
				scrHand.css("left",scrTar-scrHandSize/2);
				scrCont.css("left",pos);
			}//end if scrH
			else{
				scrHand.css("top",scrTar-scrHandSize/2);
				scrCont.css("top",pos);
			}//end else scrH
		}//end func 		 
	
	},//end fn
	scrbarBack: function() {
		$(this).trigger('scrBack');
	},//end fn
	scrbarFord: function() {
		$(this).trigger('scrFord');
	},//end fn	
	scrbarPos: function(value) {
		value=value||1;
		$(this).trigger('scrPos',[-value]);
	}//end fn	
});//end extend

})(jQuery);//闭包

/*!自定义鼠标滚轮事件
 * Version: 3.0.6
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);