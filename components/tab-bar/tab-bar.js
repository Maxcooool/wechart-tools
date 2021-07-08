// components/tab-bar/tab-bar.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        index: {
            type: Number,
            value: -1,
        },

        hide: {
            type: Number,
            value: -1,
        },
    },

    /**
     * 组件的初始数据
     */
    data: {
        pages: ['/pages/home/home', '/pages/shopping-cart/shopping-cart', '/pages/my/my'],
    },

    /**
     * 组件的方法列表
     */
    methods: {
        toggleTabBar(e) {
            wx.switchTab({ url: this.data.pages[e.currentTarget.dataset.index] });
        },
    },
});
