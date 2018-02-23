var eui = {

  formdata: function(form,fdat){
    if(form.selector === undefined) var form = $(form);
    var fdat = fdat || {};
    $.each(form.find('input.textbox-value'),function(){if($(this).val()) fdat[$(this).attr('name')] = $(this).val()});  
    return fdat;
  },
  
  frm2dic: function(frm,all){
    if(all) return eui.formdata(frm);
    else var obj = {};$.each(frm.serializeArray(), function(k,v) {obj[v.name] = v.value;}); return obj;
  }
  
}


$.extend($.fn.validatebox.methods, {
	required: function(jq, required){
		return jq.each(function(){
			var opts = $(this).validatebox('options');
			opts.required = required != undefined ? required : true;
			$(this).validatebox('validate');
		})
	},

	editable: function(jq,editable){
		return jq.each(function(){
			var opts = $(this).validatebox('options');
			opts.editable = editable != undefined ? editable:true;
			$(this).validatebox('validate');
		})
	}
})


$.extend($.fn.form.methods, {

  confirm: function(cb,msg){
    msg = msg || 'Are you sure ?'; 
    $.messager.confirm('Please Confirm',msg, function(r){
      return cb(r);
    })
  },

  getData: function(jq){
    return eui.frm2dic(jq);
  }, 

  enable: function(jq){
    return jq.each(function(){
      var frm = $(this);
      frm.removeClass('form-lock');
      frm.find('.fitem.unlock').removeClass('unlock'); 
    }) 
  },  	
 	
  disable: function(jq,omit){
    return jq.each(function(){
      var frm = $(this);
      frm.addClass('form-lock');
      frm.find('input.fkey').closest('.fitem').addClass('unlock'); 
    })  
  },
  
  
})