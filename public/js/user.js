function User(param){
	//用户名
	this.Name = param.Name || '';
	//用户连接的状态
	/*
		0 : 用户未连接
		1 : 用户已连接
	*/
	this.Status = param.Status || 0;
}