var page = {

  loading: false,
  editline: null,
  
  buten: function(ons){
    page.butons = ons||'';
    var buts = {
      t:$('#but_start'),
      p:$('#but_stop'),
      r:$('#but_restart'),
      e:$('#but_edit'),
      d:$('#but_delete'),
      s:$('#but_save'),
      x:$('#but_cancel')
    };
    
    for(var i in buts){
      if( page.butons.indexOf(i) >-1) buts[i].linkbutton('enable');
      else buts[i].linkbutton('disable');     
    }  
  },
  
  click: function(me){
    me.linkbutton('disable');
    setTimeout(function(){
      me.linkbutton('enable');  
    },2000)
  },
  
  init: function(){
    var dg = $('#pm2list'); 
    $('form#main').form('disable');
    page.buten();
    if(dg.length) dg.datagrid('unselectAll');
  },
  
  putForm: function(res){ 
    var frm = $('form#main');
    frm.data('pm2',clone(res));
    for(var d in res.proxy){res['_proxy^'+d] = res.proxy[d];}; delete res.proxy;
    for(var d in res.env.DBSA){res['_env_DBSA^'+d] = res.env.DBSA[d];}; delete(res.env.DBSA);
    for(var e in res.env){
      if(e=='TZOSET'){
        res['_env^TZOSET_PM'] = res.env[e].charAt(0);
        res['_env^TZOSET_HR'] = res.env[e].replace(/\+|\-/,'');  
      }
      else res['_env^'+e] = res.env[e];
    } delete(res.env); 
    frm.form('clear').form('load',res);
    return res;
  },

  getForm: function(){
    var frm = $('form#main');
    var fdat = frm.form('getData'), data = frm.data('pm2');
    for(var k in data){if(fdat[k]) data[k]=fdat[k]}
    for(var k in data.proxy){data.proxy[k] = fdat['_proxy^'+k]||''}
    for(var k in data.env){
      if(k=='DBSA') continue;
      else if(k=='TZOSET') {
        data.env.TZOSET = fdat['_env^TZOSET_PM']+fdat['_env^TZOSET_HR'];   
      } 
      else data.env[k] = fdat['_env^'+k]||''
    }
    for(var k in data.env.DBSA){data.env.DBSA[k] = fdat['_env_DBSA^'+k]||''}
    return data;
  },
  
  select: function(idx,row){    
    if(idx==page.editline) return false; else page.editline = idx; 
    $('#but_edit').linkbutton('unselect');
    var ons = 'edx'; if(row.status=='online') ons+='pr'; else ons+='t'
    page.buten(ons);
    ajaxget('/',{get:'host',host:row.name},function(res){
      $('form#main').form('disable');
      page.putForm(res);
    })
  }
}

$(document).ready(function(){

  $('#appid').combobox({
    editable: false,
    onChange: function(nv,ov){
      $('input.textbox-f').textbox('enable').textbox('readonly',false).textbox('required',true);
      if(nv=='vwlt') $('input.textbox-f.pure-on').textbox('disable').textbox('readonly',true);
      $('input.textbox-f.pure-on, input.textbox-f.option').textbox('required',false);
    }
  });

  $('#but_save').linkbutton({
    onClick:function(){
      page.click($(this));
      //cj(page.getForm());
      var data = page.getForm();
      data.put='yes';
      ajaxget('/',data,function(res){
      	//$('form#main').form('disable');
	  	cj(res);
	  })
      
    }
  })

  $('#but_cancel').linkbutton({
    onClick:function(){
      page.click($(this));
      location.reload();
    }
  })

  $('#but_add').linkbutton({
    onClick:function(){
      page.click($(this));
      page.init();
      $('form#main').form('reset').form('enable');
      $('#appid').combobox('readonly',false);
    }
  })

  $('#but_edit').linkbutton({
    toggle: true,
    onClick:function(){
      var sel = $(this).linkbutton('options').selected;
      if(sel) {
        $('form#main').form('enable');
        $(this).data('butons',page.butons);
        page.buten('sex');
      }
      else {
        $('form#main').form('disable');
        page.buten($(this).data('butons'));
      } 
    }
  })

  $('#but_start, #but_stop, #but_restart').linkbutton({
    onClick:function(){
      var dg = $('#pm2list');
      var row = dg.datagrid('getSelected');
      var action = $(this).attr('id').split('_')[1];
      ajaxget('/',{action:action,pm_id:row.pm_id},function(res){
        dg.datagrid('unselectAll');
        dg.datagrid('reload');
        page.init();
        page.buten();
      })
    }
  })

  $('#pm2list').datagrid({
 
    loadMsg: '',
    border:false,
    singleSelect: true,
    selidx: null,
    fit: true,
    fitColumns: true,
    method: 'get',
    url:'/',
    queryParams: {
      _dgrid: 'y',
      get: 'list'  
    },
    
    onBeforeLoad: function(param){ 
      page.loading = true;
      var sel = $(this).datagrid('getSelected');
      if(sel) {
        var idx = $(this).datagrid('getRowIndex',sel);
        $(this).datagrid('options').selidx = idx;
      }
    },
    
    onLoadSuccess: function(data){
      page.loading = false;
      var sel = $(this).datagrid('options').selidx;
      if(sel) $(this).datagrid('selectRow',sel);
    },
    
    columns:[[
      /*{field:'_cbsel', checkbox:true},*/
      {field:'pm_id', title:'#', width:25,fixed: true, align:'center'},
      {field:'name', title:'Host Name', width:100, fixed:false},
      {hidden:true, field:'pm_uptime', title:'UP Time', width:120,fixed: true,formatter: function(val){return myTime(new Date(val));}},
      {field:'PORT', title:'Port', width:25, align:'right'},
      {field:'memory', title:'Memory', width:35, align:'right'},
      {field:'_appid', title:'APP', width:20,formatter:function(val){
        if(val=='puremfg') return '<div class="icon-dg icon-pc"></div>';
        else return '<div class="icon-dg icon-touch"></div>';
      }},
      {field:'status', title:'UP', width:30, align:'center', fixed: true,formatter:function(val,row,idx){
        if(val=='online') return '<div class="icon-dg icon-tick"></div>';
        else return '<div class="icon-dg icon-cross"></div>';
      }},

    ]],
    
    onSelect: page.select,
    
    onUnSelect: function(){
      page.editline = null;
    }
    
  })
  
  page.init();
  
  setInterval(function(){
    $('#pm2list').datagrid('reload');  
  },15000)
  
})