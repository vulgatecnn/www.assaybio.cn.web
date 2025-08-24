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
<div class="location"><a href="html\default.aspx" title="首页">首页</a> &gt; <a class="daohang" href="html\info_1.aspx" title="市场动向">市场动向</a> &gt; <a class="daohang" href="html\info_1.aspx" title="市场动向">市场动向</a> &gt; <a class="daohang" href="display.aspx?id=2001" title="HJ1001-2018 标准方法宣贯会">HJ1001-2018 标准方法宣贯会</a></div>
<div class="scroll">
<div class="scrCont">
<div class="article clearfix">
<p>
<p>
		截止2019年6月美国爱德士已成功举办了七期《HJ1001-2018 酶底物法检测粪大肠菌群》行业标准宣贯会。
	</p>
<p>
<br>
</br></p>
<p>
<img alt="" src="assets\images\20190605133508_6210.jpg">
</img></p>
<p>
<br/>
</p>
<p>
		▼上海
	</p>
<p>
<img alt="" height="564" src="assets\images\20190605133914_7552.jpg" style="width:604px;height:328px;" width="1079"/>
</p>
<p>
<br/>
</p>
<p>
		▼成都
	</p>
<p>
<img alt="" height="719" src="assets\images\20190605134058_8060.jpg" style="width:603px;height:384px;" width="1080"/>
</p>
<p>
<br/>
</p>
<p>
		▼武汉
	</p>
<p>
<img alt="" height="339" src="assets\images\20190605134137_1824.jpg" style="width:604px;height:172px;" width="1080"/>
</p>
<p>
<br/>
</p>
<p>
		▼广州
	</p>
<p>
<br/>
</p>
<p>
<img alt="" height="809" src="assets\images\20190605134240_3098.jpg" style="width:608px;height:397px;" width="1080"/>
</p>
<p>
<br/>
</p>
<p>
		▼北京
	</p>
<p>
<img alt="" height="350" src="assets\images\20190605134309_9046.jpg" style="width:607px;height:244px;" width="1080"/>
</p>
<p>
<br/>
</p>
<p>
		▼合肥
	</p>
<p>
<img alt="" height="323" src="assets\images\20190605134344_1247.jpg" style="width:611px;height:272px;" width="799"/>
</p>
<p>
<br/>
</p>
<p>
		▼济南
	</p>
<p>
<img alt="" height="415" src="assets\images\20190605134420_3917.jpg" style="width:614px;height:279px;" width="1078"/>
</p>
<p>
<br/>
</p>
<p>
		会议内容：
	</p>
<p>
<p>
			  ▼01 标准解读<img align="left" alt="" height="810" src="assets\images\20190605134656_6944.jpg" style="width:340px;height:313px;" title="" width="1080"/>
</p>
<p>
			  HJ1001-2018水质 总大肠菌群、粪大肠菌群和大肠埃
		</p>
<p>
			  希氏菌的测定 酶底物法标准内容解读：
		</p>
<p>
			  ·为什么要加入酶底物检测粪大肠菌群
		</p>
<p>
			  ·适用范围
		</p>
<p>
			  ·检测原理
		</p>
<p>
			  ·样品采集要求
		</p>
<p>
			  ·试剂和耗材：科立得试剂
		</p>
<p>
			                      97孔定量盘
		</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
			  ▼02 如何扩项<img align="left" alt="" height="1440" src="assets\images\20190605134817_1506.jpg" style="width:340px;height:498px;" title="" width="1080"/>
</p>
<p>
			  实验室如何扩项、方法验证和确认：
		</p>
<p>
			  ·RB/T 214-2017 检验检测机构资质认定能力评价，
		</p>
<p>
			  检验检测机构通用要求
		</p>
<p>
			  ·CNAS-CL01-A001:2018 检测和校准实验室能力认可
		</p>
<p>
			  准则在微生物检测领域的应用说明
		</p>
<p>
			  ·精密度和准确度
		</p>
<p>
			  ·标准方法验证
		</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<img align="left" alt="" height="810" src="assets\images\20190605134954_4511.jpg" style="width:339px;height:322px;" title="" width="1080"/>
</p>
<p>
			  ▼03 质量控制
		</p>
<p>
			  科立得操作及微生物实验室质量控制：
		</p>
<p>
			  ·人、机、料、法、环、测质量控制要求
		</p>
<p>
			  ·实验过程监控项目（RICKA微生物实验监控系统）
		</p>
<p>
			  ·扩项必备--粪大肠菌群质控样品（NSI-QC）
		</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
<br/>
</p>
<p>
			2019年 HJ1001-2018酶底物法检测粪大肠菌群 行业标准宣贯会仍将继续，期待更多的实验室可以了解行业最新动态，使用最先进的武器保卫人民饮水安全！！
		</p>
</p></p></div>
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