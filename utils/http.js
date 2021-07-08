import { config } from '../config';

const tips = {
    1: '当前网络不佳，请稍后重试',
    1000: '操作失败',
    1001: '数据库异常',
    1002: '错误，请联系管理员',
    1003: '系统繁忙，请稍后重试……',
    1004: '请求参数为空或者格式错误',
    1005: '请求参数openid为空或者格式错误',
    2001: '创建订单失败 库存不足',
    2002: '创建订单失败 金额不正确',
};

class HTTP {
    #debug = config.debug;
    #baseUrl = config.api_base_url;

    request({ url, data = {}, header = {}, method = 'GET', dataType = 'json', responseType = 'text' }) {
        const options = {
            url: this.#baseUrl + url,
            method,
            header: { 'content-type': 'application/json', ...header },
            data,
            dataType,
            responseType,
        };
        this.#debug && HTTP.logRequest(options);
        return new Promise((resolve, reject) => {
            wx.request({
                ...options,
                success: result => {
                    this.#debug && HTTP.logResponse(options, result);
                    const statusCode = result.statusCode.toString();
                    if (statusCode.startsWith('2')) {
                        if (result.data.code == 0) {
                            resolve(result.data);
                        } else {
                            reject(
                                new Error(
                                    `${options.method} ${options.url} ${result.data.code} (${tips[result.data.code]})`
                                )
                            );
                            this.#show_error(result.data.code);
                        }
                    } else {
                        reject(new Error(`${options.method} ${options.url} ${result.statusCode}`));
                        this.#show_error(1);
                    }
                },
                fail: () => {
                    reject(new Error(`${options.method} ${options.url} wx.request fail`));
                    this.#show_error(1);
                },
            });
        });
    }

    #show_error = error_code => {
        if (!error_code) {
            error_code = 1;
        }
        const tip = tips[error_code];
        wx.showToast({
            title: tip ? tip : tips[1],
            icon: 'none',
        });
    };

    static #toastStack = 0;
    $showToast(msg, icon = 'none') {
        if (typeof msg === 'string') {
            HTTP.#toastStack = 0;
            wx.showToast({
                title: msg,
                icon,
            });
        }
    }
    $showLoading() {
        HTTP.#toastStack === 0 && wx.showLoading({ title: '加载中...' });
        HTTP.#toastStack++;
    }
    $hideLoading() {
        HTTP.#toastStack === 1 && wx.hideLoading();
        HTTP.#toastStack > 0 && HTTP.#toastStack--;
    }

    static #consoleSubst = wx.getSystemInfoSync().platform === 'devtools' ? '%o' : '';
    static logRequest(options) {
        console.debug(`▶▶ REQUEST ${options.url}\n${new Date().toLocaleString()}\n${HTTP.#consoleSubst}`, options);
    }
    static logResponse(options, result) {
        console.debug(`◀◀ RESPONSE ${options.url}\n${new Date().toLocaleString()}\n${HTTP.#consoleSubst}`, result);
    }
}

export { HTTP };
