;(function(){
	var w = window;
	var d = document;
	var wrapper = d.getElementById('wrapper');
	w.Rock = {
		//host : 'ws://'+'192.168.0.109',
		host : 'ws://'+'123.56.65.244',
		port : 8000,
		//连接被控制的页面
		registerRoom : function(rid){
			//告诉服务器，客户端要进入的房间号
			this.socket.emit('registerRoom',{
				room_id : rid
			});
		},
		//断开连接
		unregisterRoom : function(rid){
			var _this = this;
			this.socket.emit('unregisterRoom',{
				room_id : rid
			});
		},
		//初始化
		init : function(){
			//获取扫描的房间的roomid
			this.roomID = document.getElementById('room_id').value;
			//实例化一个socket
			this.socket = io.connect(this.host + ':' + this.port);
			
			var _this = this;
			//向服务器注册一个房间
			_this.registerRoom(_this.roomID);
			//监听用户加入的消息
			_this.onUserEnter();
			//监听用户摇动手机
			_this.onUserShake();
			//监听用户完成比赛
			_this.onUserShake();
		},
		//用户进入房间的事件
		onUserEnter : function(){
			this.socket.on('userEnter',function(obj){
				//获取传递过来的用户id
				var uid = obj.uid;

				//创建一个part
				var part = d.createElement('div');
				part.setAttribute('class','part');

				//根据客户端传递过来的uid创建对应的进度条
				var progress = d.createElement('div');
				progress.setAttribute('id',uid);
				progress.setAttribute('class','progress');

				var nick = d.createElement('div');
				nick.setAttribute('class','nick');
				nick.innerHTML = obj.nick;

				var inner = d.createElement('div');
				inner.setAttribute('class','inner');
				inner.setAttribute('id','inner-'+uid);
				inner.setAttribute('data-progress','0');

				progress.appendChild(inner);
				part.appendChild(nick);
				part.appendChild(progress);
				wrapper.appendChild(part);
			});
		},
		//用户摇手机
		onUserShake : function(){
			var _this = this;
			_this.socket.on('userShake',function(obj){
				var uid = obj.uid;
				
				if(!uid){
					return;
				}
				var p_inner = $('#inner-'+uid);
				//获取当前进度
				var progress = parseInt(p_inner.data('progress'));
				//进度递增
				if(progress + 1 > 100){
					return;
				}
				//否则
				progress++;
				//保存修改后的值
				p_inner.data('progress',progress);
				//设置宽度
				p_inner.css('width',progress + '%');
				
				//更新完progress以后，进行复查，如果完成则马上触发消息
				if(progress >= 100){
					//获取指定用户id的用户名
					document.getElementById('nick-name').innerHTML = $('#'+uid).prev().text();
					document.getElementById('award').style.display = 'block';
					
					//告诉服务器，完成摇一摇的进度了
					_this.socket.emit('complete',{
						room_id : _this.roomID,
						uid : uid
					});
				}
			});
		}
	};
	//初始化
	w.Rock.init();
})();