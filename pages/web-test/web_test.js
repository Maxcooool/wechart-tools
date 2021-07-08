const app = getApp();

Page({
  data: {},

  async onLoad() {
    await app.getOpenid();
    app.globalData.ws.subscribe({
      onMessage: this.websocketMsg,
    });
  },

  async onShow() {
    // 获取服务器时间和状态码
    await this.getTimeAndLivestate();
    //更新倒计时
    this.updateLiveInterval();
  },
  /**
   * websocket 消息
   */
  websocketMsg(res) {
    switch (res.liveKey) {
      case "liveStateUpdate":
        this.setData({
          liveState: res.liveValue.state,
        });
        this.requestAll();
        break;

      case "stream":
        this.setData({
          liveRoomId: res.liveValue.url,
        });
        break;

      case "force":
        this.setData({
          liveRoomId: res.liveValue.url,
        });
        this.requestAll(true);
        break;
    }
  },

  /**
   * 管理所有请求，在正确的时间发送正确的请求
   */
  requestAll() {
    switch (this.data.liveState) {
      // 敬请期待
      case 67:
        break;

      case 0:
        // 是否预约
        this.getUserIsReservation();
        this.setData({
          // twoHoursBeforeLive: true,
        });
        break;

      // 直播中
      case 50:
        this.getLiveStream();
        this.setData({
          isBook: 3,
        });
        break;

      // 回放生成中
      case 65:
        break;

      // 回放中
      case 66:
        this.getLiveStream();
        this.setData({
          isBook: 4,
        });
        break;
    }
  },

  /**
   * 获取服务器时间和状态码
   */
  getTimeAndLivestate() {
    return getServertime().then((res) => {
      const { time: countDown, liveState } = res.data;
      this.setData({
        countDown,
        liveState,
      });
      this.requestAll();
    });
  },
});
