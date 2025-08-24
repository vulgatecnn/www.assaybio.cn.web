/*!

 * Common.js 3.0 
 * 制作者：网新页面制作-孙超
 * Copyright 2013-2014, Kendie
 * 一些实用小js集合，方便后期使用

 */

$.fn.kendie = function(option){
	var defaults = {
		type:'nav',
		interTime :3000,
		delayTime :1500,
		slideTime :300,
		effect:"fold",
		titCell:".hd li",
		mainCell:".bd",
		maxHeight:0,
		minHeight:0,
		trigger:"mouseover",
		vis:0
	};
	option = $.extend(defaults, option);
	return this.each(function(){
		var mst;
		var user = $(this)
		var type = option.type;
		var effect = option.effect;
		var trigger = option.trigger;

		var iTime = parseInt(option.interTime);
		var dTime = parseInt(option.delayTime);
		var sTime = parseInt(option.slideTime);
		var maxH = parseInt(option.maxHeight);
		var minH = parseInt(option.minHeight);
		var vis = parseInt(option.vis);

		var hdCell = $(option.titCell, user);
		var bdCell = $(option.mainCell, user);

		if(type=='banner'){ //banner切换
			bdCell.css({"display": "none"});
			function shownext(){
				var active = bdCell.filter(".on").length ? bdCell.filter(".on") : bdCell.first();
				var next =  active.next().length ? active.next() : bdCell.first();
				active.css({"display": "block"});
				mst = setTimeout(function(){
					active.removeClass('on').css({"display": "none"});
					active.animate({
						opacity: 0
					})
					next.css({opacity: 0.0,"display": "block"}).addClass('on').animate({opacity: 1.0});
				},iTime)
			}
			bdCell.first().css({"display": "block"});
			setInterval(function(){
				shownext();
			},iTime);
		};

		if(type=='nav'){ //纵向菜单
			hdCell.hover(function(){
				var _this = $(this)
				_this.find("a:eq(0)").addClass("current");
				mst = setTimeout(function(){
					effect=="fold"?_this.find(bdCell).slideDown():_this.find(bdCell).show();
					mst = null;
				},sTime)
			},function(){
				if(mst!=null) {clearTimeout(mst)};
				$(this).find("a:eq(0)").removeClass("current");
				effect=="fold"?$(this).find(bdCell).slideUp():$(this).find(bdCell).hide();
			})
			$(bdCell).hover(function(){
			},function(){
				effect=="fold"?$(this).slideUp():$(this).hide();
			});
		};

		if(type=='equalHeight'){ //左右等高
			var a = hdCell.outerHeight();
			var b = bdCell.outerHeight();
			if ( a >= b){ bdCell.outerHeight(a) }
			else if ( a <= b){ hdCell.outerHeight(b);}
		};

		if(type=='hover'){ //点击效果，默认滑动
			if(trigger='hover'){
				bdCell.hover(function(){
					$(this).addClass("on")
				},function(){
					$(this).removeClass("on")
				})
			}else if(trigger='click'){
				bdCell.toggle(function(){
					$(this).addClass("on")
				},function(){
					$(this).removeClass("on")
				})
			}
		};

		if(type=='conNav'){ //横向菜单
			hdCell.hover(function(){
				var _this = $(this)
				_this.find("a:eq(0)").addClass("current");
				mst = setTimeout(function(){
					_this.find(bdCell).width(_this.find(bdCell).find("a").length*_this.find(bdCell).find("a").innerWidth());
					_this.find(bdCell).slideDown();
					mst = null;
				},sTime)
			},function(){
				if(mst!=null) {clearTimeout(mst)};
				$(this).find(bdCell).hide();
				$(this).find("a:eq(0)").removeClass("current");
			})
			bdCell.hover(function(){
			},function(){
				$(this).hide();
			})
		};

		if(type=='picItem'){ //图片自动排版
			hdCell.width(bdCell.outerWidth());
			var piW = bdCell.outerWidth();
			var pilW =user.width();
			var pad = Math.floor((pilW - piW*vis)/(vis*2));
			hdCell.css({"padding-top":"10px","padding-bottom":"10px","padding-left":pad,"padding-right":pad});
		};

		if(type=='adver'){ //拉屏广告
			var topPicH = user.height()
			user.animate({
				height:maxH
			},1000);
			mst = setTimeout(function(){
				user.animate({
					height:minH
				},"slow");
			},iTime)
			mst = setTimeout(function(){
				hdCell.hide();
				bdCell.show();
				if(minH==0){
					$(user).hide();
				}
			mst = null;
			},(iTime+500))
		};

		if(type=='ltBottom'){ //拉屏广告
			var _offTop = bdCell.offset().top;
			$(window).scroll(function(){
				var _scrollTop = $(window).scrollTop();
				if(_offTop<=_scrollTop){
					bdCell.css({position:"fixed",top:"0px"});
				}else{
					bdCell.css("position",(_offTop<=_scrollTop)? "fixed":"static");
				}
			})
		};
	});
};


//屏蔽右键相关
var jsArgument = document.getElementsByTagName("script")[document.getElementsByTagName("script").length-1].src;	//获取传递的参数
rightButton = jsArgument.substr(jsArgument.indexOf("rightButton=") + "rightButton=".length, 1);
if (rightButton == "1")
{
	document.oncontextmenu = function(e){return false;}
	document.onselectstart = function(e){return false;}
	if (navigator.userAgent.indexOf("Firefox") > 0)
	{
		document.writeln("<style>body {-moz-user-select: none;}</style>");
	}
}

//设为首页
function setHomePage()
{
	if(document.all)
	{
		var obj = document.links(0);
		if (obj)
		{
			obj.style.behavior = 'url(#default#homepage)';
			obj.setHomePage(window.location.href);
		}
	}
	else
	{
		if(window.netscape)
		{
			try
			{
				netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
			}
			catch (e)
			{
				window.alert("此操作被浏览器拒绝，请通过浏览器菜单完成此操作！");
			}
		}
		}
}

//加入收藏
function addFavorite()
{
	var url		= document.location.href;
	var title	= document.title;
	if (document.all)
	{
		window.external.addFavorite(url,title);
	}
	else if (window.sidebar)
	{
		window.sidebar.addPanel(title, url,"");
	}
}
