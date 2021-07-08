// components/popup/popup.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },

    position: {
      type: String,
      value: "bottom",
    },

    // 是否可以点击蒙版关闭
    autoClose: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    visible: false,
    contentVisible: false,
  },

  observers: {
    show(newVal) {
      if (newVal !== this.data.visible) {
        if (newVal) {
          this.setData({
            visible: true,
            contentVisible: true,
          });
        } else {
          this.setData({
            contentVisible: false,
          });
        }
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onMaskClose() {
      if (!this.properties.autoClose) {
        return;
      }
      this.onClose()
    },

    onClose() {
      this.setData({
        contentVisible: false,
      });
      this.triggerEvent("close");
    },

    onAnimaitonEnd() {
      if (!this.data.contentVisible) {
        this.setData({
          visible: false,
        });
      }
    },
  },
});
