# 网站首页\n\n**原始标题**: 上海安净生物技术有限公司 -Assay Biotechnology\n**页面URL**: http://www.assaybio.cn/default.aspx\n**抓取时间**: 2025/8/24 16:37:52\n**内容字数**: 1 字\n**图片数量**: 4 张\n**链接数量**: 11 个\n\n---\n\n## 页面内容\n\n沪ICP备19033946号-1沪公网安备 31011202012026号 营业执照
		
		

			
				
                    
					
                    
					
                    
					
                    
					
				
			
			
123
		
		
			
			 
				About Us　　　　关于我们
                
				Literature　　文献资料
                
				Market Trend　　　　市场动向
                
				Product　　　　产品
                
				Home　　首页
                
			
		
	

	
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






   jQuery(".banner").slide({titCell:".hd ul",mainCell:".bd ul",autoPage:true,effect:"fold",autoPlay:true,interTime:5000,delayTime:2000});\n\n---\n\n*此页面由通用网站抓取器于 2025/8/24 16:37:52 抓取保存*