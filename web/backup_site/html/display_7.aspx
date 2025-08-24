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
<div class="location"><a href="html\default.aspx" title="首页">首页</a> &gt; <a class="daohang" href="html\info_1.aspx" title="市场动向">市场动向</a> &gt; <a class="daohang" href="html\info_1.aspx" title="市场动向">市场动向</a> &gt; <a class="daohang" href="display.aspx?id=1995" title="《认监委关于开展2019年国家级检验检测能力验证工作的通知》">《认监委关于开展2019年国家级检验检测能力验证工作的通知》</a></div>
<div class="scroll">
<div class="scrCont">
<div class="article clearfix">
<p>
<a class="ke-insertfile" href="/Upload/editor/file/20190417/20190417133622_3951.pdf" target="_blank"><strong><span style="font-size:14px;">2019年国家级检验检测能力验证工作-邀请函</span></strong></a>
</p>
<p>
<p>
<br>
</br></p>
<p>
<p>
			2019年3月，国家认监委下发了《认监委关于开展2019年国家级检验检测能力验证工作的通知》（国认监〔2019〕6号）。受国家认监委委托，北京国实检测技术研究院与爱德士缅因生物制品贸易（上海）有限公司承担B类项目“饮用水中隐孢子虫和贾第鞭毛虫检测(CNCA-19-B05)”的实施和协调工作。
		</p>
<p>
			为保证此次能力验证活动有序、顺利的开展，现将有关事项通知如下：
		</p>
<p>
<br/>
</p>
<p>
<strong>01意义</strong>
</p>
<p>
			开展本次能力验证活动的目的是了解饮用水中隐孢子虫和贾第鞭毛虫检测领域的整体水平，能力验证的结果是检验检测机构在相关领域检测能力的客观反映。对于能力验证结果满意的参加者，由认监委对社会公布名录。能力验证满意结果作为参加者相关检验检测项目的能力证明，<span style="color:#E53333;"><strong>该参加者2年内可免于相关项目的现场评审</strong></span>。鼓励其他政府部门、社会组织及其他方选择使用能力验证结果满意的检验检测机构提供技术服务。
		</p>
<p>
<strong><br/>
</strong>
</p>
<p>
<strong>02要求 </strong>
</p>
<p>
			（1）已经获得的检验检测机构资质认定（CMA）或实验室认可（CNAS）的能力范围中包括GB5749-2006《生活饮用水卫生标准》中隐孢子虫和贾第鞭毛虫检测的检验检测机构或实验室。
		</p>
<p>
			（2）已经建立了水中隐孢子虫和贾第鞭毛虫检测能力的检验检测机构或实验室，尚未通过检验检测机构资质认定（CMA）或实验室认可（CNAS）的，以及资质认定或实验室认可的检测能力范围不包括水中隐孢子虫和贾第鞭毛虫检测能力的检验检测机构或实验室。
		</p>
<p>
			（3）其他具备水中隐孢子虫和贾第鞭毛虫检测能力的检验检测机构或实验室。
		</p>
<p>
<strong><br/>
</strong>
</p>
<p>
<strong>03方法 </strong>
</p>
<p>
			本次能力验证活动不限制参加检验检测机构对验证项目检测标准/方法的使用，参加检验检测机构可根据自身情况选择较好的检测方法。
		</p>
<p>
<br/>
</p>
<p>
<strong>04报名 </strong>
</p>
<p>
			为了保证本次能力验证的顺利实施，请各检验检测机构于<span style="color:#E53333;"><strong>2019年5月8日前</strong></span>将《能力验证项目计划报名表》，邮件同时发至：<a href="mailto:gsbzb@cnlab.org.cn">gsbzb@cnlab.org.cn</a> 和 china-water@idexx.com
		</p>
<p>
			联系电话：010-62178818、021-61278913
		</p>
<p>
			能力验证发样时间：2019年6月下旬
		</p>
<p>
<br/>
</p>
<p>
<strong>05费用 </strong>
</p>
<p>
			报名参加本次能力验证活动的检验检测机构，需向项目承担单位北京国实检测技术研究院支付<strong><span style="color:#E53333;">能力验证费用1980元</span></strong>（包含2支样品，不同浓度）。
		</p>
<p>
			     请于<strong><span style="color:#E53333;">2019年5月13日前</span></strong>将能力验证费寄交下列帐户：
		</p>
<p>
			     户    名：北京国实检测技术研究院
		</p>
<p>
			     银行账号：11050161360000000648
		</p>
<p>
			     开 户 行：中国建设银行北京西四支行
		</p>
<p>
			     纳税人识别号：91110108MA006AM23K
		</p>
<p>
			汇款时请注明“能力验证2019-B05”，并将汇款底单和开具增值税专用发票信息发电子邮件至： gsbzb@cnlab.org.cn
		</p>
<p>
<br/>
</p>
<p>
<strong>06联系方式 </strong>
</p>
<p>
			各单位在参加能力验证过程中如遇到问题，请及时与我们联系：
		</p>
<p>
			单位：爱德士缅因生物制品贸易（上海）有限公司
		</p>
<p>
			联系人：赵旭坤/王晓丹
		</p>
<p>
			邮箱：<a href="mailto:china-water@idexx.com">china-water@idexx.com</a>
</p>
<p>
			电话：13701632427 / 13764569860
		</p>
<p>
<br/>
</p>
<p>
			单位：北京国实检测技术研究院
		</p>
<p>
			联系人：郭云峰
		</p>
<p>
			邮箱： gsbzb@cnlab.org.cn
		</p>
<p>
			电话：010-62178818
		</p>
<p>
<br/>
</p>
<p>
<br/>
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