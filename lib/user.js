function User(param){
	//用户名
	this.Name = param.Name || '';
	//用户连接的状态
	/*
		0 : 用户未连接
		1 : 用户已连接
	*/
	this.Status = param.Status || 0;
	//用户昵称
	this.Nick = param.Nick || '匿名';
}
exports.create = function(param){
	//返回一个用户的示例
	return new User(param);
};