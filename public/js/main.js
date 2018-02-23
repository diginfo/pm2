function ce(s) { console.error(s); }
function cd(s) { console.debug(s); }
function cl(s) { console.debug(s); }
function ci(s) { console.info(s); }
function cj(s) { console.log(JSON.stringify(s,null,2)); }

function pad(val,max) { var str=val.toString(); return str.length < max ? pad("0" + str, max) : str;}
function jsonParse(data){try{return JSON.parse(data)} catch(e){return data}}
function jsonString(data){try{return JSON.stringify(data)} catch(e){return data}}
function clone(obj){return jsonParse(jsonString(obj))}

function myDate(date){ var y = date.getFullYear(); var m = pad(date.getMonth()+1,2); var d = pad(date.getDate(),2); return y+'-'+m+'-'+d;}
function myTime(date){var y = date.getFullYear(); var m = pad(date.getMonth()+1,2); var d = pad(date.getDate(),2); var h = pad(date.getHours(),2); var i = pad(date.getMinutes(),2);var s = pad(date.getSeconds(),2);return y+'-'+m+'-'+d+' '+h+':'+i+':'+s;}

function isodate(date,fmt){
	if(date instanceof Date){
  	var y=date.getFullYear(),m=pad(date.getMonth()+1,2),d=pad(date.getDate(),2); 
    if(fmt) return y+'-'+m+'-'+d;
    else return y+m+d;
  }
	var dstr = date.toString();
	if(dstr.length != 8) return date;
	var b = dstr.match(/([0-9]{4})([0-9]{2})([0-9]{2})/);
	return new Date(b[1]+'/'+b[2]+'/'+b[3]);
}

// ajax-GET
function ajaxget(url,vars,cb,avar){  
  avar = avar || {async:true};
  $.ajax({
    async: avar.async,
    url: url || '/',
    type: 'GET',
    enctype:"multipart/form-data",
    data: vars,
    success: function(data) {
      cb(data);
    },
    error: function(err) {cb(err)}
  })    
}