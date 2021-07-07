// components/message-box/message-box.js
const app = getApp()
Component({
  // 启用插槽
  options: {
    multipleSlots: true,
  },

  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: "",
    },
    btnText: {
      type: String,
      value: "确定",
    },
    // 父组件通过show来控制显隐
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    visible: true,
  },

  // 监听show的变化改变visible
  observers: {
    show(newVal) {
      if (newVal !== this.data.visible) {
        if (newVal) {
          this.setData({
            visible: true,
          });
        } else {
          this.setData({
            visible: false,
          });
        }
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    open() {
      this.setData({
        visible: true,
      });
    },

    onClose() {
      this.setData({
        visible: false,
      });
    },

    jumpToHugoVipMiniApp() {
      console.log('注册为会员>>>');
      this.setData({
        visible: false,
      })
      // 跳转到 HUGO BOSS 会员计划注册
      app.jumpMiniApp({
        // appId: "wx5445456456456456",
        // path: "/pages/home/main",
      });
    },
  },
});
