(function(){
	"use strict";
	//扩展easyui-form的方法
	$.extend($.fn.form.methods, {
		getData: function(jq){
			var obj = {};
			jq.find("*").each(function(){
				var name = $(this).attr("name");
				if(name){
					if(obj[name]){
						if(this.checked){
							obj[name] = this.value;
						}
					}else{
						obj[name] = $(this).val();
					}
				}
			});
			return obj; 
		},
		/**
		 * 验证表单，获取对象
		 * @param $form:表单jquery对象
		 * @param extraParamObj:需要额外增加或修改的属性值
		 * @returns {Boolean:验证失败返回false,object:验证成功返回封装好的对象}
		 */
		myValidate : function($form,extraParamObj){
			if(!$form.form("validate")) return false;
			return $.extend($form.form("getData"),extraParamObj);
		}
	});
	var Base = window.Base = {
		log : function(){
			if('console' in window){
				try{
					console.log.apply(console,arguments);
				}catch(ex){}
			}
		},
		getHtmlByTpl : function(tpl,obj){
			for(var i in obj){
				var reg = new RegExp("\\$\\{" + i + "\\}","g");
				var val = obj[i];
				if(val === undefined || val === null){
					val = "";
				}
				tpl = tpl.replace(reg,val);
			}
			return tpl;
		},
		alert : function(mes){
			$.messager.alert("消息",mes,"info");
		},
		show : function(mes){
			$.messager.show({title:'消息',msg:mes,timeout:2000});
		},
		getTreeOptions : function(options,$dv){
			if($dv === undefined){
				$dv = $("body");
			}
			var onBeforeLoad = options.onBeforeLoad;
			options.onBeforeLoad = function(node,param){
				$dv && $(this).tree("options").url && $dv.jqloading();
				if(param){
					//防止缓存
					param._t = +new Date;
				}
				onBeforeLoad && onBeforeLoad.call(this,node,param);
			};
			var onLoadSuccess = options.onLoadSuccess;
			options.onLoadSuccess = function(){
				$dv && $dv.jqloading("end");
				onLoadSuccess && onLoadSuccess.apply(this,arguments);
			};
			return $.extend({
				method : "get",
				onBeforeCheck : function(node, checked){
					if(node && checked){
						var attr = node.attributes;
						if(attr && attr.isAuthed === 0){
							ake.setMessage($(node.target),"抱歉,您没有该节点权限");
							return false;
						}
					}
					return true;
				}
			},options);
		}
	};
	//加载中效果插件
	(function($) {
		function getPos($this) {
			var pos = $this.position(), 
				ml = parseInt($this.css("margin-left"), 10), 
				mt = parseInt($this.css("margin-top"), 10);
			return {
				w : $this.innerWidth(),
				h : $this.innerHeight(),
				l : pos.left + (isNaN(ml) ? 0 : ml),
				t : pos.top + (isNaN(mt) ? 0 : mt)
			};
		}
		function isRBF(dom){
			return dom.tagName.toLowerCase() === 'body' 
				|| "relative absolute fixed".indexOf(($(dom).css("position") || "").toLowerCase()) !== -1;
		}
		var TPL = "<div data-num='1' onselectstart='return false' class='nosel jloading $cls' $sty>"
					+ "<div class='jloading-mask jloading-static'></div>"
					+ "<div class='jloading-dv'><span>$str</span></div>" 
				+ "</div>",
			JQ_NUM = 0;
		$.fn.jqloading = function(str) {
			str = str || '加载中...';
			var result = $(this);
			$(this).each(function() {
				var $this = $(this), 
					newPos;
				switch (str) {
				case "end":
					var $jloading = $this.children("div.jloading");
					var num = Number($jloading.attr("data-num")) - 1;
					if(num === 0){
						$jloading.remove();
					}else{
						$jloading.attr("data-num",num);
					}
					JQ_NUM--;
					break;
				case "resize":
					var $loading = $this.children("div.jloading");
					if ($loading.length !== 0) {
						if (isRBF(this)) {
							$loading.removeAttr("style").addClass("jloading-static");
						} else {
							newPos = getPos($this);
							$loading.removeClass("jloading-static").css({
								width : newPos.w,height : newPos.h,
								left : newPos.l,top : newPos.t
							});						
						}
					}
					break;
				case "isloading":
					result = $this.children("div.jloading").length > 0 ? true : false;
					return result;
				default:
					var $jloading = $this.children("div.jloading");
					if ($jloading.length === 0) {
						JQ_NUM++;
						var tpl = TPL.replace("$str", str);
						if (isRBF(this)) {
							$this.append(tpl.replace("$cls","jloading-static").replace("$sty", ""));
						} else {
							newPos = getPos($this);
							$this.append(tpl.replace("$cls", "").replace("$sty","style='width:"+ newPos.w
									+ "px;height:" + newPos.h + "px;left:" + newPos.l
									+ "px;top:" + newPos.t + "px;'"));
						}
					}else{
						$jloading.attr("data-num",Number($jloading.attr("data-num")) + 1);
					}
				}
			});
			return result;
		};
	})($);
	//jquery ajax封装
	(function(Base){
		var defaultSetting = {
			cache : false,
			dataType : 'json'
		};
		function doAjax(url,param,callback,$area,setting,mes){
			if($area !== null){
				$area = $area || $("body");
			}
			setting = $.extend({
				url : url,
				beforeSend : function(){
					$area && $area.jqloading(mes);
				},
				complete : function(){
					$area && $area.jqloading('end');
				},
				data : param,
				error : function(result){
					if(callback){
						callback.call($area,undefined,"网络异常,请重试");
					}else{
						Base.alert("网络异常,请重试");
					}
					$area && $area.jqloading('end');
				},
				success : function(result){
					if(callback){
						if(!result){
							Base.alert("返回数据异常,请重试");
						}else{
							if(result.isSuccess === undefined){
								return callback.call($area,result);
							}
							if(result.isSuccess){
								callback.call($area,result.data);
							}else{
								callback.call($area,undefined,result.data);
							}
						}
					}
				}
			},defaultSetting,setting);
			$.ajax(setting);
		}
		Base.ajax = function(){
			defaultSetting.type = "GET";
			doAjax.apply(null,arguments);
		};
		Base.ajaxP = function(){
			defaultSetting.type = "POST";
			doAjax.apply(null,arguments);
		};
	})(Base);
})();