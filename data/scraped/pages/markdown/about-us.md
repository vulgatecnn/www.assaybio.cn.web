# 关于我们\n\n**原始标题**: 无标题\n**页面URL**: http://www.assaybio.cn/info.aspx?id=00010001\n**抓取时间**: 2025/8/24 16:37:52\n**内容字数**: 1 字\n**图片数量**: 1 张\n**链接数量**: 14 个\n\n---\n\n## 页面内容\n\n沪ICP备19033946号-1沪公网安备 31011202012026号 营业执照
		

			
                
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


    function getUrlParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = window.location.search.substr(1).match(reg);  //匹配目标参数
        if (r != null) return unescape(r[2]); return null; //返回参数值
    }



			About Us关于我们
			
                
                    
        				
                            
        					< 关于我们

                                   
                                 
                                    
                                
                             

        					
                            
        					< 联系我们

                                   
                                 
                                    
                                
                             

        					
                            
        					< 新闻动态

                                   
                                 
                                    
                                
                             

        					
                            
        				
        				
                    
                    
                        
                        
                            
                        
                        
                    
                
			
             
                $(function() {$('.scroll2').scrbarOn();});
            
		

		
			首页 > 关于我们 > 关于我们
			
				
					
						
                            
	 


	Assay Biotechnology成立于2009年，是一家新兴的专业技术服务公司。 


	公司专注于 水中微生物检测技术及方法 的研发、引进和推广。对于国标106项规定中，6项微生物指标：总大肠菌群、耐热大肠菌、大肠埃希氏菌、菌落总数、隐孢子虫、贾第鞭毛虫的检测技术，均掌握了目前世界上较为先进的检验方法、技术，并销售相应设备及耗材，提供后续技术服务。 


	 


	在大肠菌群及菌落总数的检测领域，所推广的美国IDEXX DST固定底物技术酶底物法，是目前检测时间较短，检测条件较不受限制，检测效果较好的方法。从2009年只有寥寥数十家用户，发展至今已超过300多家企事业单位用户,服务区域涵盖华东区、华北区、西北区。 


	 


	在隐孢子虫和贾第鞭毛虫检测领域，我们代理的美国IDEXX Filta-Max xpress检测系统，即是国标认证的方法之一，更是目前世界上较先进，自动化程度较高的两虫检测方法，其专利性的独特滤芯结构，更适合中国的水体条件并能处理高浊度、大容量的淘洗要求。该检测系统和方法虽然较其他品牌晚进入中国市场，但因其出色的操作自动化程度和稳定高效的两虫回收率。 


	 


	除了优良的产品和技术，我们更注重售前、售中及售后服务所体现的服务价值。每年，我们举办的大大小小的水中微生物检测技术交流培训会不下6场，平均每2个月一次的交流、学习和专家互动机会让我们的终端用户有了更好的使用平台。无论对检测方法的掌握，还是在应用领域的提升，我们都尽心做好相关工作，以自己专业的销售团队，技术团队来服务好每一个用户。 


	 


	以“技术支持 + 销售服务”这种服务为导向的组织架构让公司的运营简单而高效，能以快速的响应来满足客户的需求。坚持专业、专注让我们在业内有了良好的口碑，并赢得了客户的认可。 


	 


	我们只专注于水中微生物检测领域，我们更专心于提供系统、无忧的服务。 


	 


	


	 

						
					
				
				
					
					
						
					
					
				
			
		
	


    $(function () { $('.scroll').scrbarOn(); });\n\n---\n\n*此页面由通用网站抓取器于 2025/8/24 16:37:52 抓取保存*