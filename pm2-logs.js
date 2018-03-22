#!/usr/bin/env node

var readline = require('readline');
var fs = require('fs');
var asy = require("async");
var path = require('path');
var cl = console.log;

var his, __his = __dirname+'/history.json';
try{his = require(__his)} 
catch(err){his = {};hisput('init',true)}

function strpad(str,len,chr){
  chr = chr || ' ';
  if(str.length > len) return str.substr(0,len-3)+'...';
  return str += new Array(len-str.length+1).join(chr);
}

function hisget(id,uid){
  var idu = id+'_'+uid;
  if(!(idu in his)) his[idu]=null;
  return his[idu];
}

function hisput(id,val,uid){
  var idu = id+'_'+uid;
  if(!(idu in his)) his[idu]=null;
  if(his[idu] != val) his[idu]=val;
  return fs.writeFileSync(__his,JSON.stringify(his,null,2));
}

function hislast(id,uid){
  var last = hisget(id,uid);
  if(last) return last;
  return ''; 
}

function walkSync(dir, filelist) {
  files = fs.readdirSync(dir);
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      var rel = dir.replace(lpath,'')+'/';
      if((/net-out-.*\.log$/).test(file)){ 
        filelist.push(path.join(lpath, file));
      }
    }
  });
  
  return filelist;
};

var lpath = '/root/.pm2/logs/';
var data = [];
const rl = readline.createInterface({input: process.stdin,output: process.stdout}); 
rl.question('Enter 3 Letter User ID:', function(uid){
  uid = uid.toLowerCase();
  rl.question(strpad('Start Time:',12), function(start){
    if(start.length < 14) {cl('Invalid Date/Time:'+start); return rl.close();}
    hisput('log_start',start,uid);
    rl.question(strpad('End Time: ',12), function(end){
      hisput('log_end',end,uid)  
      rl.question(strpad('Site ID: ',12), function(sid){
        if(sid && typeof(sid)=='string') {
          sid = sid.toUpperCase().replace(/ /g,'');
          var sids = new RegExp(sid.split(',').join('|'));
        }
        hisput('log_sid',sid,uid)  
        rl.close();
        var files = walkSync(lpath,[]);
        asy.eachSeries(files,function(file,next){
          var logs = fs.readFileSync(file,'utf-8');
          if(!logs) return next();
          var lines = logs.split('\n');
          var site = file.replace(lpath,'').split('.')[0].toUpperCase();
          if(sids && !sids.test(site)) return next();
          lines.map(function(line,i){
            line = line.trim().replace(/\u001b\[.*?m/g, '');
            var bits = line.split(' ');
            var ts = bits.slice(0,2).join(' ').replace(/:$/,'');
            if(ts >= start && ts <= end){
              var lb = bits.slice(2).join(' ').match(/.{1,80}/g);
              var log = lb[0].trim();
              if(lb.length > 1) {
                log += "\n";
                lb.slice(1).map(function(e){log+=Array(29).join(' ')+e+"\n"})
              }
              
              data.push([strpad(ts,16),strpad(site,10),log]);
            }
          });
          next();
        },function(){
          cl(strpad('=',110,'='))
          data.sort().map(function(x){
            cl(x[0],x[1],x[2]);
          })
          cl(strpad('=',110,'='))
        })
  
      })
      rl.write(hislast('log_sid',uid));
    })
    rl.write(hislast('log_end',uid));
  })
  rl.write(hislast('log_start',uid));
})