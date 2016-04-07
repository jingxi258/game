var express = require('express');
var hbs = require('hbs');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//标识符生成模块
var uuid = require('node-uuid');

//二维码生成模块
var qrCode = require('qrcode-npm');

//房间模块
var room = require('./lib/room.js');
//用户模块
var user = require('./lib/user.js');

//房间列表
var rooms = [];

//设置express的静态资源目录
app.use('/static', express.static(__dirname + '/public'));
//app.use('/static', express.static('/public'));
//设置模板引擎的后缀名
app.set('view engine','html');

//运行hbs木块
app.engine('html',hbs.__express);
app.set('views', __dirname + '/views');

//路由处理
app.get('/', function(req, res){
	/*
	//创建一个房间
	var r = room.createRoom({
		RoomID : createKey()
	});
	//添加到房间列表中
	rooms.push(r);
	*/
	var rid = createKey();
	//定义协议
	var http = 'http://'
	//获取请求的url
	var host = req.headers.host;
	//生成对应的二维码
	var qr = qrCode.qrcode(8,'M');
	qr.addData(http + host + '/client/' + rid);
	qr.make();

	res.render('server',{
		data : qr.createImgTag(8),
		room_id : rid
	});
});

app.get('/server', function(req, res){
	res.render('server');
});

app.get('/client*', function(req, res){
	res.render('client');
});

//在线房间列表
var onlineRooms = {};
//当前在线人数
var onlineCount = 0;

io.on('connection', function(socket){
	//监听房间注册
	socket.on('registerRoom',function(obj){
		//房间的socket名称设置为房间的id
		socket.name = obj.room_id;
		//检查是否已经有该房间
		if(!onlineRooms.hasOwnProperty(obj.room_id)){
			//如果该房间不存在则创建该房间
			var r = room.createRoom({
				RoomID : obj.room_id
			});
			//将房间添加到房间列表中
			onlineRooms[obj.room_id] = r;
		}else{
			console.log(obj.room_id + ' existed!');
		}
	});
	//监听用户接入
	socket.on('login',function(obj){
		var rid = obj.room_id;
		//找到对应的房间
		var r = onlineRooms[rid];
		if(r.Users.length >= r.Max){
			console.log('Room '+rid+' is full');
			return;
		}else{
			//找到该房间并修改相应的数据
			var index = r.Users.length + 1;
			var u = user.create({
				Name : rid + index,
				Nick : obj.nick == '' ? '匿名' + index : obj.nick
			});
			//用户的socket的名称设置为房间id+序号
			socket.name = rid + index;
			//用户进入房间
			r.Users.push(u);
		}
		//返回连接的用户它的uid，用于后面的通信
		//用当前socket来回发一条消息，而不能用广播，否则会影响所有的socket
		var _s = socket;
		_s.emit('login',{
			uid : u.Name
		});
		//告诉对应的server.html页面，新的用户加入
		var s = io.sockets.sockets;
		for(var i = 0;i < s.length;i++){
			if(s[i].name == rid){
				//找到该用户所在的房间对应的socket
				s[i].emit('userEnter',{
					uid : rid + index,
					nick : u.Nick
				});
			}
		}
	});
	//处理shake消息
	socket.on('shake',function(obj){
		//获取房间号和用户id
		var rid = obj.room_id;
		var uid = obj.uid;
		
		//告诉对应的进度条页面操作
		var s = io.sockets.sockets;
		for(var i = 0;i < s.length;i++){
			if(s[i].name == rid){
				//当用户全部进入房间才摇手机有用
				if(onlineRooms[rid].Users.length < onlineRooms[rid].Max){
					return;
				}
				//找到该用户所在的房间对应的socket
				s[i].emit('userShake',{
					uid : uid
				});
			}
		}
	});
	//监听比赛完成事件
	socket.on('complete', function(obj){

		//获取消息来源（房间号）
		var room_id = obj.room_id;
		//获取消息内容
		var uid = obj.uid;
		//告诉client页面，取消shake事件
		var s = io.sockets.sockets;
		for(var i = 0;i < s.length;i++){
			//根据用户id生成的规则来获取client的socket
			if(s[i].name.indexOf(room_id) >= 0 && s[i].name.length > room_id.length){
				//获取用户名
				var tmp = '';
				for(var u = 0;u < onlineRooms[room_id].Users.length;u++){
					if(onlineRooms[room_id].Users[u].Name == uid){
						tmp = onlineRooms[room_id].Users[u].Nick;
					}
				}
				//找到该用户所在的房间对应的socket
				console.log(uid + ' ' + tmp);
				s[i].emit('userComplete',{
					uid : uid,
					nick : tmp
				});
			}
		}
	});
});

//生成唯一的room的id
function createKey(){
	//取字符串的前6位
	return uuid.v4().substr(0,6);
}
//启动服务器
http.listen(8000, function(){
	console.log('listening on *:8000');
});