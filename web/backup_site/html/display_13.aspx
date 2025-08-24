<!DOCTYPE html>

<html>
<head>
<meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
<title></title>
<meta content="" name="keywords"/>
<meta content="" name="description"/>
<link href="assets\css\Kd_Common.css" rel="stylesheet" type="text/css"/>
<link href="assets\css\Kd_Inside.css" rel="stylesheet" type="text/css"/>
<script src="assets\js\jquery-1.7.2.min.js" type="text/javascript"></script>
<script src="assets\js\jquery.scrbar.js" type="text/javascript"></script>
<script src="assets\js\common.js" type="text/javascript"></script>
<script src="assets\js\jquery.SuperSlide.2.1.js" type="text/javascript"></script>
</head>
<body>
<div class="header">
<div class="wrap">
<div class="copyright">
<a href="http://beian.miit.gov.cn" target="_blank">沪ICP备19033946号-1</a><a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=31011202012026" target="_blank"><img alt="" src="assets\images\20200103084118_7482.png" style="vertical-align:middle;margin-left:10px;"/>沪公网安备 31011202012026号</a> <a href="/Upload/editor/image/20230221/20230221155844_1967.jpg" target="_blank"><span style="color:#FFFFFF;">营业执照</span></a><br/>
</div>
<div class="iNav">
<ul class="clearfix">
<li><a class="" href="html\info_2.aspx">About Us<em>　　　　关于我们</em></a></li>
<li><a class="" href="html\info_4.aspx">Literature<em>　　文献资料</em></a></li>
<li><a class="current" href="html\info_1.aspx">Market Trend<em>　　　　市场动向</em></a></li>
<li><a class="" href="html\info_6.aspx">Product<em>　　　　产品</em></a></li>
<li><a class="" href="html\default.aspx">Home<em>　　首页</em></a></li>
<div class="iNavBg"></div>
</ul>
</div>
<script>	

$(".iNav li").eq(1).addClass("iNav_2")
	$(".iNav li").eq(3).addClass("iNav_4")
	$(".iNav li a").each(function(i){
		if($(this).attr("class")=="current"){
			var parClass = $(".iNav li").eq(i).attr("class");
			if(parClass=="iNav_2"||parClass=="iNav_4"){
				$('.iNavBg').addClass("on");
			}
			$(".iNav li").eq(i).addClass("on")
		}
	})
	$(".iNav li").hover(function(){
		$(this).addClass("on");
		if($(this).attr("class")=="iNav_2 on"||$(this).attr("class")=="iNav_4 on"){
			$('.iNavBg').addClass("on")
		}
	},function(){
		$(this).removeClass("on");
		if($(this).attr("class")=="iNav_2"||$(this).attr("class")=="iNav_4"){
			$('.iNavBg').removeClass("on")
		}
	})
</script>
</div>
</div>
<div class="container">
<div class="wrap clearfix">
<script type="text/javascript">
    $(document).ready(function () {
        var url = location.href;
        var vlurl = getUrlParam("id");
        var showid;

        showid = vlurl.substring(0, 8);
        var _this = $("#" + showid);
        if (vlurl.length > 8) {
            $("." + vlurl).addClass("current");

        }
        else {
            _this.find("li a:first").addClass("current");
        }
        $("#" + showid).show();


    });
</script>
<script>
    function getUrlParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = window.location.search.substr(1).match(reg);  //匹配目标参数
        if (r != null) return unescape(r[2]); return null; //返回参数值
    }
</script>
<div class="sidebar">
<h2 class="colPicTitle">Market Trend<em>市场动向</em></h2>
<div class="menu">
<div class="scroll2">
<div class="scrCont">
<dl>
<dt><a class="current" href="html\Info_12.aspx">&lt; 市场动向</a>
<dd>
<ul class="third" id="00020001" style="display:none">
</ul>
</dd>
</dt>
</dl>
</div>
<div class="scrPanel">
<div class="btnBack"></div>
<div class="scrZone">
<div class="scrHand"></div>
</div>
<div class="btnFord"></div>
</div>
</div>
</div>
<script type="text/javascript">
                $(function() {$('.scroll2').scrbarOn();});
            </script>
</div>
<div class="main">
<div class="location"><a href="html\default.aspx" title="首页">首页</a> &gt; <a class="daohang" href="html\info_1.aspx" title="市场动向">市场动向</a> &gt; <a class="daohang" href="html\info_1.aspx" title="市场动向">市场动向</a> &gt; <a class="daohang" href="display.aspx?id=1745" title="IDEXX 两虫检测培训中心">IDEXX 两虫检测培训中心</a></div>
<div class="scroll">
<div class="scrCont">
<div class="article clearfix">
<p align="center">
<span style="font-size:14px;"><strong>两虫检测培训中心</strong></span>
</p>
<p>
<span style="font-size:14px;"></span> 
</p>
<p>
<span style="font-size:14px;">第一期培训班：</span><span style="font-size:14px;">2015年</span><span style="font-size:14px;">3月25-27日</span>
</p>
<p>
<span style="font-size:14px;">第二期培训班：</span><span style="font-size:14px;">2015年</span><span style="font-size:14px;">6月24-26日</span>
</p>
<p>
<span style="font-size:14px;">第三期培训班：</span><span style="font-size:14px;">2015年</span><span style="font-size:14px;">9月23-25日</span>
</p>
<p>
<span style="font-size:14px;">第四期培训班：2015年</span><span style="font-size:14px;">12月23-25日</span>
</p>
<p>
<span style="font-size:14px;font-family:宋体;line-height:110%;"><span style="font-size:14px;font-family:宋体;"></span></span> 
</p>
</div>
</div>
<div class="scrPanel">
<div class="btnBack"></div>
<div class="scrZone">
<div class="scrHand"></div>
</div>
<div class="btnFord"></div>
</div>
</div>
</div>
</div>
</div>
<script type="text/javascript">
    $(function () { $('.scroll').scrbarOn(); });
</script>
</body>
<!--[if lt IE 7]><script src="js/iepng.js"></script><![endif]-->
</html>