#!/usr/bin/env node

var readline = require('readline');
var fs = require('fs');
var asy = require("async");
var cl = console.log;
var path = require('path');

function exec(cmd,cb){
	var childProcess = require('child_process');
	childProcess.exec(cmd,function (error, stdout, stderr) {
		if(typeof(cb)=="function") {
			if(error){ return cb({error:true,'err':error,'std':stderr,'msg':stderr});}
			else return cb(stdout);
		} else return null;
	});
};

function intpad(n){if(n<10) return "0"+n; return n.toString()}

function strpad(str,len,chr){
  str = str.toString();
  chr = chr || ' ';
  if(str.length > len) return str.substr(0,len-3)+'...';
  return str += new Array(len-str.length+1).join(chr);
}

function keysort(array, key) {return array.sort(function(a, b) {var x = a[key]; var y = b[key];return ((x < y) ? -1 : ((x > y) ? 1 : 0));});}

// var def = [['TIME',9],['SITE',8],['FRQ',3], ['UNITS',6],['EVENT ID',50]];
function dohead(def){var tit=[],ul=[];def.map(function(e){tit.push(strpad(e[0],e[1]));ul.push(strpad('=',e[1],'='))});cl(tit.join(' '));cl(ul.join(' '))}
function dorow(def,row){var r=[];row.map(function(col,idx){r.push(strpad(col,def[idx][1]))});cl(r.join(' '))}

/* ######################## */

var lpath = '/usr/share/nodejs/pure3r/node_modules/';
var sqlite3 = require(lpath+'sqlite3');
function get(file,site,cb){
  var md = new Date().toLocaleString("en-us", { month: "short" }).split(' ').slice(0,3).join(' ');
  var db = new sqlite3.Database(file);
  db.all("select '"+site+"' as site, duration, duration_parameter, next_trigger_time, id from events where trigger_on = 'timer' and next_trigger_time like '"+md+"%' ORDER BY next_trigger_time ASC;", function(err, rows) {
    cb(rows);  
  });	
  db.close();
}

var pm2 = require('/usr/share/nodejs/pm2/pm2-apps.js');
var dbs = [];
pm2.getAll().map(function(site){
  if(site.appid=='puremfg'){
    dbs.push([site.name.split('.')[0],site.env.DATA]);  
  }
})

var evts=[];
asy.eachSeries(dbs,function(db,next){
  var path = db[1]+'/dwap.db';
  get(db[1]+'/dwap.db',db[0],function(rows){
    evts = evts.concat(rows.sort());
    next();
  });
},function(){
  cl('');
  var def = [['TIME',9],['SITE',8],['FRQ',3], ['UNITS',6],['EVENT ID',50]];
  dohead(def);
  keysort(evts,'next_trigger_time').map(function(evt){
    var dt = new Date(evt.next_trigger_time);
    var ds = [intpad(dt.getHours(),2),intpad(dt.getMinutes(),2),intpad(dt.getSeconds(),2)].join(':');
    dorow(def,[ds,evt.site,evt.duration,evt.duration_parameter,evt.id]);
  })
  cl(strpad('=',80,'='))
})
