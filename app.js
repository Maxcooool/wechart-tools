import { config } from './config';
import { WS } from './utils/websocket';

import { AppModel } from './models/app.model';

const model = new AppModel();

App({
    DEBUG: config.debug,

    async onLaunch(options) {
        if (options.query.channel) {
            this.globalData.channel = options.query.channel;
        }
        /**
         * WebSocket
         */
        this.globalData.ws = new WS('wss://xxxxx/pushWebSockets/' + (await this.getOpenid()));
    },

    async onShow(options) {
        if (options.query.channel) {
            this.globalData.channel = options.query.channel;
        }

        this.mtj.trackEvent('app_show', {
            channel: this.globalData.channel,
        });

        this.checkUpdate();
        this.getOpenid({
            refresh: options.referrerInfo && options.referrerInfo.extraData && options.referrerInfo.extraData.mz,
        });
        if (this.globalData.ws) {
            this.globalData.ws.reconnect();
        }
    },

    onHide() {
        this.globalData.ws.disconnect();
    },

    globalData: {
      
    },

    getOpenid(param = {}) {
        return model.getOpenid(param);
    },
    getMemberInfo(param = {}) {
        return model.getMemberInfo(param);
    },
    saveSubscribeMessage(param) {
        return model.saveSubscribeMessage(param);
    },

    /**
     * 检查更新
     */
    checkUpdate() {
        const updateManager = wx.getUpdateManager();

        updateManager.onCheckForUpdate(function (res) {
            // 请求完新版本信息的回调
            console.log('CheckForMiniUpdate:' + res.hasUpdate);
        });

        updateManager.onUpdateReady(function () {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                success(res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate();
                    }
                },
            });
        });

        updateManager.onUpdateFailed(function () {
            // 新版本下载失败
        });
    },

    /**
     * 隐藏返回首页按钮
     */
    hideHomeButton() {
        try {
            wx.hideHomeButton();
        } catch (err) {
            if (this.globalData.DEBUG) {
                console.log('此微信版本无需隐藏返回首页按钮');
            }
        }
    },

    /**
     * 分享
     */
    shareApp() {
        return {
            title: '',
            path: '/pages/home/home',
            imageUrl: 'shareapp/share.png',
        };
    },

    //跳转 其他小程序
    jumpMiniApp({ appId, path, callback = null }) {
        try {
            wx.navigateToMiniProgram({
                appId,
                path,
                // envVersion: 'trial',
                envVersion: 'release',
                success: res => {
                    this.log(res);
                    !!callback && callback('success');
                },
                fail: err => {
                    this.log(err);
                    !!callback && callback('fail');
                },
            });
        } catch (error) {
            this.error(error);
        }
    },

    require($url) {
        return require($url);
    },

    //百度移动统计
    bdtj(eventName, args = {}) {
        statisticsAll(eventName, args);
    },

    log(...params) {
        this.console('log', ...params);
    },
    info(...params) {
        this.console('info', ...params);
    },
    warn(...params) {
        this.console('warn', ...params);
    },
    error(...params) {
        this.console('error', ...params);
    },
    console(type, ...params) {
        if (this.DEBUG) {
            console[type](...params);
        }
    },
});
