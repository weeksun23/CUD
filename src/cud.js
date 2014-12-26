(function(){
	"use strict"
	if($("#cud-style").length === 0){
		$("head").append("<style id='cud-style'>" +
			".cud-label{display:inline-block;text-align:right;vertical-align:middle}" +
			".cud-span{display:inline-block;vertical-align:middle}" +
			".cud-p{margin-bottom:10px;}" +
		"</style>");
	}
	var WIN_TPL = "<div id='${id}' style='display:none;${style}'>" +
		"<form class='windowform'>${formHTML}</form>" +
	"</div>",
		LABEL_TPL = "<label class='cud-label' style='width:${labelWidth}px;'>${text}:</label>",
		SPAN_TPL = "<span class='cud-span' style='width:${inputWidth}px;'>${fieldInput}</span>",
		INPUT_TPL = "<input class='fieldItem vam' type='${inputType}' data-field='${value}' name='${value}' data-type='${type}' style='width:${width}px'${readonly}/>",
		TEXTAREA_TPL = "<textarea class='fieldItem vam' data-field='${value}' name='${value}' data-type='${type}'" +
				"style='width:${width}px;height:${height}px'></textarea>",
		CHOOSE_TPL = INPUT_TPL + "<a class='choosebtn' href='javascript:void(0)'>选择</a>",
		CHECKBOX_TPL = "<input class='fieldItem vam' type='checkbox' data-field='${value}' name='${value}' data-type='${type}'/>",
		ROW_TPL = "<p class='cud-p'>${item}</p>";
	//设置一行HTML到form中
	function setPHTML(formHTML,pHTML){
		if(pHTML.length !== 0){
			formHTML.push(ROW_TPL.replace("${item}",pHTML.join("")));
			pHTML.length = 0;
		}
	}
	//生成窗口
	function createWin(winId,fields,options){
		var formColumnsNum = options.formColumnsNum;
		var formHTML = [];
		var pHTML = [];
		var hiddenHTML = [];
		var label = LABEL_TPL.replace("${labelWidth}",options.labelWidth),
			span = SPAN_TPL.replace("${inputWidth}",options.inputWidth);
		for(var i in fields){
			//如果够一行
			if(pHTML.length === formColumnsNum){
				setPHTML(formHTML,pHTML);
			}
			var item = fields[i];
			if(item.type === "hidden"){
				hiddenHTML.push("<input type='hidden' class='fieldItem' data-type='hidden' data-field='"+i+"' name='"+i+"'/>");
				continue;
			}
			var colspan = item.colspan || 1;
			var labelHTML = label.replace("${text}",item.text);
			if(colspan === 1){
				pHTML.push("<span data-field='outer-"+i+"'>" + labelHTML + span.replace("${fieldInput}",getInputHtml(item,i)) + "</span>");
			}else if(colspan === formColumnsNum){
				//先设置之前的行HTML
				setPHTML(formHTML,pHTML);
				//该input占一行
				pHTML.push("<span data-field='outer-"+i+"'>" + labelHTML + getInputHtml(item,i) + "</span>");
				setPHTML(formHTML,pHTML);
			}else{
				$.error("暂不支持");
			}
		}
		setPHTML(formHTML,pHTML);
		formHTML.push(hiddenHTML.join(""));
		$("body").append(Base.getHtmlByTpl(WIN_TPL,{
			id : winId,
			style : options.style,
			formHTML : formHTML.join("")
		}));
	}
	//配置cud dialog
	function initDialog(){
		var me = this;
		return $("#" + me.winId).show().dialog({
			buttons : [{
				text : "确定",
				iconCls : "icon-save",
				handler : function(){
					var opts = me.options;
					var $win = $("#" + me.winId);
					var bean = $win.find("form.windowform").form("myValidate");
					if(!bean) return;
					var onBeforeOper = opts.onBeforeOper;
					if(onBeforeOper){
						bean = onBeforeOper.call(me,me.oper,bean);
						if(bean === false) return;
					}
					Base.log(bean);
					Base.ajaxP(opts[me.oper === "add" ? 'addUrl' : 'editUrl'],bean,function(data,mes){
						if(data){
							if(opts.gridId){
								//绑定的是datagrid
								$("#" + opts.gridId).datagrid("reload");
							}else if(opts.treeGridId){
								//绑定的是treeGrid
								me.reloadTreeGrid(me.oper === "edit" || me._addType === 'same');
							}
							$win.dialog("close");
							Base.show('操作成功');
							opts.onAfterOper && opts.onAfterOper.call(me,data,me.oper,bean);
						}else{
							Base.alert(mes);
						}
					},$win);
				}
			},{
				text : "返回",
				iconCls : "icon-redo",
				handler : function(){
					$("#" + me.winId).dialog('close');
				}
			}],
			modal : true
		});
	}
	//遍历所有字段 初始化成相应组件
	function initFields($win){
		var me = this;
		$win.find(".fieldItem").each(function(){
			var $this = $(this);
			var name = this.name || $this.attr("comboname");
			var type = $this.attr("data-type");
			var opts = me.fields[name].options;
			if("text|textarea|choose|checkbox|hidden".indexOf(type) === -1){
				if(type === "combobox"){
					opts = $.extend({
						editable : false,
						required : true
					},opts);
				}else if(type === "combotree"){
					opts = Base.getTreeOptions(opts,$("#" + me.winId));
				}else if(type === "validatebox" || type === "password"){
					if(type === "password"){
						type = "validatebox";
					}
					opts = $.extend({
						required : true
					},opts);
					$this.addClass("fieldItem-simple");
				}
				$this[type](opts);
			}else{
				$this.addClass("fieldItem-simple");
				if(type === 'choose'){
					//储存textfield
					$this.attr("data-textField",opts.textField || "");
					//绑定点击事件
					var v = opts.validatebox;
					var onChoose = opts.onChoose;
					var $next = $this.css("cursor","pointer").click(onChoose).next("a.choosebtn")
						.linkbutton({iconCls : "micon-img1"}).click(onChoose);
					if(v){
						v = $.extend({
							deltaX : $next.outerWidth(true),
							missingMessage : "请点击选择"
						},v);
						$this.validatebox(v);
					}
				}
			}
		});
	}
	function afterShow(params,$win){
		var me = this;
		$win.dialog("setTitle",params.title);
		var data = params.data;
		if(me.oper === "edit"){
			var onBeforeEdit = me.options.onBeforeEdit;
			if(onBeforeEdit){
				data = $.extend({},data);
				onBeforeEdit.call(me,data);
			}
			$win.find("form.windowform").form("load",data)
			.find("input.fieldItem[data-type='choose']").each(function(){
				var $this = $(this);
				var field = $this.attr("data-field");
				var textField = $this.attr("data-textField");
				$this.val(textField ? data[textField] : "").attr("data-id",data[field]);
			});
		}else{
			if(me.options.treeGridId){
				var $grid = $("#" + me.options.treeGridId);
				var sRow = $grid.treegrid("getSelected");
				var val = "";
				if(sRow){
					var id = sRow[me.options.idField];
					if(me._addType === 'same'){
						var pRow = $grid.treegrid("getParent",id);
						if(pRow){
							val = pRow[me.options.idField];
						}
					}else{
						val = id;
					}
				}
				me.getFieldElement(me.options.superIdField).val(val);
			}
		}
		var func = me.options.onShowWin;
		func && func.call(me,$win,me.oper,data);
	}
	//打开CUD窗口
	function showWin(params){
		var winId = this.winId;
		var $win = $("#" + winId);
		//如果窗口不存在 则根据fields生成窗口HTML
		if($win.length === 0){
			var fields = this.fields;
			var options = this.options;
			var me = this;
			createWin(winId,fields,options);
			$win = initDialog.call(this);
			initFields.call(this,$win);
			var func = me.options.onInitFields;
			if(func){
				func.call(me,$win,function(){
					afterShow.call(me,params, $win);
				});
			}else{
				afterShow.call(me,params, $win);
			}
		}else{
			afterShow.call(this,params, $win.dialog("open"));
		}
	}
	//更新treegrid节点
	function reloadTreeGrid(isReloadParent){
		var opts = this.options;
		var $grid = $("#" + opts.treeGridId);
		var sRow = $grid.treegrid("getSelected");
		if(sRow){
			var id = sRow[opts.idField];
			if(isReloadParent){
				//取消选择 bug
				$grid.treegrid("unselect",id);
				var pRow = $grid.treegrid("getParent",id);
				if(pRow){
					$grid.treegrid("reload",pRow[opts.idField]);
				}else{
					$grid.treegrid("reload");
				}
			}else{
				$grid.treegrid("append",{
					parent : id,
					data : [{menuId : -1,name : 'temp'}]
				}).treegrid("reload",id);
			}
		}else{
			$grid.treegrid("reload");
		}
	}
	//选择后编辑
	function editAfterSel(data){
		this.oper = "edit";
		showWin.call(this,{
			title : "编辑" + getSelName.call(this,data) + "信息",
			data : data
		});
	}
	//选择后删除
	function delAfterSel(data){
		var me = this;
		this.oper = 'del';
		$.messager.confirm("确认信息","确认删除该" + getSelName.call(this,data) + "吗?",function(r){
			if(r){
				var obj = {},
					opts = me.options,
					idField = opts.idField;
				obj[idField] = data[idField];
				var onBeforeOper = opts.onBeforeOper;
				if(onBeforeOper){
					obj = onBeforeOper.call(me,me.oper,data);
					if(obj === false) return;
				}
				Base.ajaxP(opts.delUrl,obj,function(result,mes){
					if(result){
						if(opts.gridId){
							$("#" + opts.gridId).datagrid("reload");
						}else if(opts.treeGridId){
							$("#" + opts.treeGridId).treegrid("remove",obj[idField]);
						}
						opts.onAfterOper && opts.onAfterOper.call(me,result,me.oper,data);
						Base.show("操作成功");
					}else{
						Base.alert(mes);
					}
				});
			}
		});
	}
	function getSelName(sRow){
		var textField = this.options.textField,
			extra = "";
		if(textField){
			extra = "(" + sRow[textField] + ")";
		}
		return this.options.name + extra;
	}
	//获取filed 的html
	function getInputHtml(item,key){
		var type = item.type || "text";
		var target = INPUT_TPL,
			obj = {
				value : key,
				type : type,
				width : item.width || 150,
				readonly : "",
				inputType : "text"
			};
		if(type === "textarea"){
			if(item.options){
				type = "validatebox";
			}
			target = TEXTAREA_TPL;
			obj.heihgt = item.height || 80;
			obj.width = item.width || 200;
		}else if(type === "choose"){
			target = CHOOSE_TPL;
			obj.width = item.width || 90;
			obj.readonly = " readonly='readonly'";
		}else if(type === 'checkbox'){
			target = CHECKBOX_TPL;
		}else if(type === "password"){
			obj.inputType = "password";
		}
		return Base.getHtmlByTpl(target,obj);
	}
	function CUD(winId,fields,options){
		//窗口的id
		this.winId = winId;
		//字段对象
		this.fields = fields;
		//操作标志
		this.oper = null;
		//treegrid add type 下级sub 同级same
		this._addType = null,
		options = $.extend({
			//60可容纳4个12px中文
			labelWidth : 60,
			//170可容纳普通input
			inputWidth : 170,
			//窗口style
			style : "padding:10px 10px 0 10px",
			//表单列数
			formColumnsNum : 2,
			//所绑定的datagrid id
			gridId : null,
			//id字段名
			idField : null,
			//所绑定的treegrid id
			treeGridId : null,
			//所绑定的treegrid superId id
			superIdField : null,
			//提示信息字段
			textField : null,
			//添加的URL
			addUrl : null,
			//编辑的URL
			editUrl : null,
			//删除的URL
			delUrl : null,
			//名称
			name : null,
			//在发送操作请求前 执行函数 返回false停止执行
			onBeforeOper : null,
			//操作成功后回调
			onAfterOper : null,
			//初始化字段时触发函数
			onInitFields : null,
			//在编辑前，主要用于对编辑的数据预处理
			onBeforeEdit : null,
			//打开窗口后触发函数
			onShowWin : null
		},options);
		this.options = options;
	}
	CUD.prototype = {
		add : function(data,title){
			this.oper = "add";
			showWin.call(this,{
				title : title || ("添加" + this.options.name + "信息"),
				data : data
			});
		},
		addSame : function(data){
			this._addType = "same";
			this.add(data,"添加同级" + this.options.name + "信息");
		},
		addSub : function(data){
			this.getSelected(function(){
				this._addType = "sub";
				this.add(data,"添加下级" + this.options.name + "信息");
			});
		},
		edit : function(data){
			if(data){
				editAfterSel.call(this,data);
			}else{
				this.getSelected(function(sRows){
					var sRow = sRows[0];
					editAfterSel.call(this,sRow);
				});
			}
		},
		del : function(data){
			if(data){
				delAfterSel.call(this,data);
			}else{
				this.getSelected(function(sRows){
					var sRow = sRows[0];
					delAfterSel.call(this,sRow);
				});
			}
		},
		getSelected : function(func,isSingle){
			var $grid = $("#" + (this.options.gridId || this.options.treeGridId));
			var sRows = $grid[this.options.gridId ? "datagrid" : "treegrid"]("getSelections");
			if(sRows.length === 0){
				Base.alert("请选择" + this.options.name + "信息");
			}else{
				if(isSingle && sRows.length > 1){
					return Base.alert("只能选择一个" + this.options.name + "执行此操作");
				}
				func.call(this,sRows);
			}
		},
		getFieldElement : function(fieldValue){
			return $("#" + this.winId).find(".fieldItem[data-field='" + fieldValue + "']");
		},
		toggleFieldElement : function(fieldValue,action){
			return this.getOuterElement(fieldValue)[action]();
		},
		getOuterElement : function(fieldValue){
			return $("#" + this.winId).find("span[data-field='outer-"+fieldValue+"']");
		},
		reloadTreeGrid : reloadTreeGrid
	};
	window.CUD = CUD;
})();