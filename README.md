cud.js
===

标准的基于easyui datagrid的增删改操作都是这样的：一个datagrid展示数据，用户可以选择某一行数据进行删除、编辑操作，或者通过点击按钮添加数据，其中修改、添加操作是通过弹窗实现的。要实现这样的功能，我们必须进行以下一系列操作：编写窗口html代码、初始化dialog、初始化dialog中的组件(combobox、validatebox、combotreee等)、编辑时将数据带到窗口的form中、CUD后刷新datagrid等等。每来一个CURD页面，我们就必须重复以上操作。

于是，我将这些操作封装起来，形成cud.js。使用cud.js，用户只需定义字段信息(类型、名称等)，增删改的url就能实现基本的cud操作。其还提供各种操作回调应对各种特殊情况。

使用示例
===
```javascript
var curd = new CUD("funcWin",{
    //各种字段信息
	protFuncId : {type : 'hidden'},
	abbre : {
		type : "validatebox",text : "简称"
	},
	name : {
		type : "validatebox",text : "名称"
	},
	type : {
		type : "combobox",text : "类型",options : {
			data : [{
				value : "pack",text : "预处理"
			},{
				value : "data",text : "数据项"
			},{
				value : "time",text : "时间"
			}]
		}
	},
	paraDesc : {
		type : "textarea",text : "参数说明",colspan : 2
	},
	funcDesc : {
		type : "textarea",text : "函数说明",colspan : 2
	},
	notes : {
		type : "textarea",text : "备注",colspan : 2
	}
},{
  //配置项
	gridId : "grid",
	idField : "protFuncId",
	textField : "name",
	name : "函数",
	addUrl : "saveData.do",
	editUrl : "saveData.do",
	delUrl : "deleteData.do"
});
```
更多内容以及使用方法请查看源码。
