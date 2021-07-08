class WS {
    url = ''; // websocket地址
    task = null; // websocket连接任务
    isOpened = false; // websocket连接是否已打开
    isConnecting = false; // 是否正在创建连接
    subscribers = []; // 回调函数列表

    _heartbeatTimer = null; // 心跳重连延时器
    _reconnectTimer = null; // 断线重连延时器
    _maxTry = 3; // 最大断线重连次数
    _retry = 0; // 已经尝试断线重连的次数，连接成功后归零

    constructor(url) {
        this.url = url;
        this._createWebSocket();
    }

    /**
     * 接收消息
     * @param {String} channel 频道
     * @param {Function} onMessage 回调函数
     */
    subscribe({ channel, onMessage }) {
        this.subscribers.push(onMessage);
    }

    /**
     * 发送消息
     * @param {String} channel 频道
     * @param {String} message 消息
     */
    publish({ channel, message }) {
        this.task.send({
            data: JSON.stringify(message),
        });
    }

    /**
     * 关闭和释放连接
     */
    disconnect() {
        if (this.isOpened) {
            this.task.close({
                code: 1000,
                reason: '手动关闭',
            });
        }
    }

    /**
     * 重新连接
     */
    reconnect() {
        if (!this.isOpened) {
            this._createWebSocket();
        }
    }

    /**
     * 创建连接
     */
    _createWebSocket() {
        if (!this.isConnecting) {
            this.isConnecting = true;
            this.task = wx.connectSocket({
                url: this.url,
                success: res => {
                    console.log('创建websocket:', res);
                },
            });
            this._initEventHandle();
        }
    }

    /**
     * 监听事件
     */
    _initEventHandle() {
        /* 收到消息 */
        this.task.onMessage(res => {
            this._heartbeat();
            let data;
            try {
                data = JSON.parse(res.data);
            } catch (error) {
                data = res.data;
            }
            this.subscribers.forEach(item => {
                item(data);
            });
            console.log('websocket: ', data);
        });

        /* 连接打开 */
        this.task.onOpen(() => {
            console.log('websocket连接成功');
            this.isOpened = true;
            this.isConnecting = false;
            this._heartbeat();
            this._retry = 0;
        });

        /* 错误事件 */
        this.task.onError(err => {
            console.log('websocket连接错误:', err);
            this.isOpened = false;
            this.isConnecting = false;
            this._reconnect();
        });

        /* 连接关闭 */
        this.task.onClose(res => {
            console.log('websocket连接关闭:', res);
            this.isOpened = false;
            this.isConnecting = false;
            // 非正常关闭
            if (res.code !== 1000) {
                this._reconnect();
            }
        });
    }

    /**
     * 心跳重连
     */
    _heartbeat() {
        if (this._heartbeatTimer) {
            clearTimeout(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
        this._heartbeatTimer = setTimeout(() => {
            console.log('websocket心跳重连');
            this._createWebSocket();
            this._heartbeatTimer = null;
        }, 65000);
    }

    /**
     * 断线重连
     */
    _reconnect() {
        //  如果没有正在进行的重连，且尝试次数没有达到上限
        if (!this._reconnectTimer && this._retry < this._maxTry) {
            this._reconnectTimer = setTimeout(() => {
                this._createWebSocket();
                this._reconnectTimer = null;
            }, 1000);
            this._retry++;
            console.log('websocket retry:', this._retry);
        }
    }
}

export { WS };
