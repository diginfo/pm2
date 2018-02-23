function jsonParse(data){try{return JSON.parse(data)} catch(e){return data}}
function jsonString(data){try{return JSON.stringify(data,null,2)} catch(e){return data}}

function cl(s) {console.log(s)}
function cj(s) {console.log(jsonString(s))}

var express = require('express');
var app = express();
var pm2 = require('pm2');
var fs = require('fs');

var redis = require('redis');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var rc = redis.createClient();
var sessionStore = new RedisStore({
  client: rc,
  ttl: 60,
  prefix: '_omssg:'
});

app.use(session({
  resave : false,
  saveUninitialized: true,
  rolling: true,
  store: sessionStore, 
  secret: 'bukit8002', 
  cookie:{
    maxAge: 60000 * 5
  }
}));

app.use(express.static(__dirname+'/public'));
app.set('views', __dirname+'/views');
app.set('view engine', 'jade')

var jap = require('./apps.js');

// this needs refreshing on save.
var apps = jap.getAll(true);

// Flatten the json object.
function flatten(data){
	var fdat = {}; 
	for(var i in data){
		var item = data[i];
		if(i=='proxy') {for(var d in item){fdat['_proxy^'+d] = item[d]}}
		else if(i=='env') {
			for(var d in item){
			  if(d=='TZOSET'){
			    fdat['_env^TZOSET_PM'] = item[d].charAt(0);
			    fdat['_env^TZOSET_HR'] = item[d].replace(/\+|\-/,'');  
			  }
			  else if(d=='DBSA') {
				  for(var x in item[d]){
					  fdat['_env_DBSA^'+x] = item[d][x]
					}
				}
			  else fdat['_env^'+d] = item[d];
			};
		} else fdat[i] = item;
	} 
	return fdat;
}

function expand(data){
	var jdat={
		proxy:{},
		env:{
			'TZOSET':data['_env^TZOSET_PM']+data['_env^TZOSET_HR'],
			DBSA:{}
		}
	};
	for(var i in data){
		var bits = i.split('^');
		if(bits.length==1) jdat[i]=data[i];
		else if(bits[0]=='_proxy') jdat.proxy[bits[1]]=data[i];
		else if(bits[0]=='_env' && bits[1].indexOf('TZOSET')!=0) jdat.env[bits[1]]=data[i];
		else if(bits[0]=='_env_DBSA') jdat.env.DBSA[bits[1]]=data[i];
	}
	return jdat;
}

/*
function getName(qry,cb){
	var fname = apps[qry.name]._filename;
	if(!fname) return cb({error:true,msg:'File not found.'})
	var app = jsonParse(fs.readFileSync(__dirname+'/json/'+fname, 'utf8'));
	if(qry._all) return cb(app);
	else if(app.apps) app.apps.map(function(a,i){
		a._apps_idx = i;
		if(a.name==qry.name) return cb(a);
	})
	else return cb(app);
}
*/


function error(err){
  if (err) {
    console.error(err);
    process.exit(2);
  };   
}

function connect(cb){
  pm2.connect(true,function(err) {
    error(err);
    cb();
  })  
}

function getList(qry,cb){
  pm2.connect(true,function(err) {
    if (err) {
      console.error(err);
      process.exit(2);
    }
    
    pm2.list(function(err,list){
    	var data = []; list.map(function(e){
        var row = e.pm2_env;
        row.pid = e.pid;
        row.name = e.name;
        row.cpu = e.monit.cpu;
        row.memory = (e.monit.memory/1000000).toFixed(1)+' MB';
        row._filename = apps[e.name]._filename;
        row._appid = apps[e.name].appid;
        if((/puremfg|vwlt/).test(row._appid)) data.push(row);	
    	}); cb(data);
    	pm2.disconnect();
    })
    
  })
}

// get a single user's session ID
function usersid(user_id){
  var ss = sessionStore.sessions;
  return cl(ss);
  for(var sid in ss){ 
    cl(ss[sid]);
    var ses = JSON.parse(ss[sid]);
    if(ses.user_id==user_id) return sid; 
  }  
}

setInterval(function(){
  rc.keys("_omssg:*", function(error, keys){
    console.log("Number of active sessions: ", keys.length);
  });	
},15000)

app.get('/*', function (req, res) {
  
  //cl(sessionStore);
  
  /*
  sessionStore.get(req.sessionID,function (err, session) {
    cl('@@@ '+req.sessionID+' @@@');
    console.log(session);
  })
  */
  
  if(!req.session.user_id) {
    req.session.user_id = 'PAC';
  } 

  function reply(data){
    if(req.query._dgrid) return res.json({rows:data,total:data.length}); 
    else return res.json(data); 
  }
  
  if(req.query.get) switch(req.query.get){
    case 'list': getList(req.query,reply); break;
    case 'host':
    	reply(jap.getHost(req.query.host));
    	break;   
  }

  else if(req.query.put){
	  //req.query._all = true;
    //getName(req.query,function(app){
		  var app = jap.getAll();
		  delete(req.query.put); for(var key in req.query){if(key.indexOf('_')==0) delete(req.query[key])};
      if(app.apps) app.apps.map(function(e,i){		  
			  if(req.query.name==e.name) {
  			  app.apps[i]=req.query;
        }
		  });
      else app = req.query;
      
      // write app to file & reload apps.
      var fname = apps[req.query.name]._filename;
      jap.putFile(fname,app);
	  
	  //})
  }

  else if(req.query.action && req.query.pm_id && (/start|stop|restart/).test(req.query.action)) {
    // if(req.query.passwd != 'bukit8002') reply({error:true, msg:'Not Authorised.'})
    connect(function(){
      pm2[req.query.action](req.query.pm_id,function(err,res){
        error(err);
        reply(res[0]);              
      })  
    })
  }
  
  else {
    if(req.url=='/') var file = 'index.jade'
    else var file = req.url.replace(/\//g,'').replace(/\.htm./i,'.jade')  
    res.render(file, { title: 'xxx', message: 'Hello world'});    
  }
});

app.listen(process.env.PORT, function () {
  console.log('Listening on port: '+process.env.PORT);
});
