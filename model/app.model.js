import { HTTP } from '../utils/http';
import { promisic } from '../utils/api';

class AppModel extends HTTP {
    #taskLogin = null;
    #taskOpenid = null;
    #taskGetMemberInfo = null;

    /**
     * 检查登录状态
     * @return {Boolean} 真：已登录；假：未登录或登录过期
     */
    get sessionState() {
        return promisic(wx.checkSession)()
            .then(() => true)
            .catch(() => false);
    }

    /**
     * 登录获取 code 并缓存，缓存没有或者登录已过期再去请求
     * 如果有正在进行的请求，会等待该请求返回而不是再次发送请求
     */
    async login(refresh = false) {
        if (refresh || !this.#taskLogin || !(await this.sessionState)) {
            this.#taskLogin = promisic(wx.login)()
                .then(result => result)
                .catch(error => {
                    this.#taskLogin = null;
                    throw error;
                });
        }
        return this.#taskLogin;
    }

    /**
     * 获取用户 openid，并缓存，缓存没有再去请求
     * 如果有正在进行的请求，会等待该请求返回而不是再次发送请求
     * @param {Boolean} all 为真时返回全部响应数据，默认只返回 openid
     * @param {Boolean} refresh 如果为真，强制重新获取 openid
     * @param {Number} maxTry 如果 openid 获取失败，尝试重新获取，最多尝试 maxTry 次，默认 3 次
     * @param {Object} data 除 code 外的其它请求参数
     * @param {Object} header 请求头
     * @return {Promise} openid 的响应结果
     */
    async getOpenid({ all = false, refresh = false, maxTry = 3, data = {}, header = {} } = {}) {
        if (refresh || !this.#taskOpenid) {
            this.#taskOpenid = this.#getOpenid(refresh, maxTry, data, header);
        }
        if (all) {
            return this.#taskOpenid;
        } else {
            return (await this.#taskOpenid).openid;
        }
    }

    /**
     * 获取用户 openid
     * @param {Boolean} refresh 如果为真，重新 login
     * @param {Number} maxTry 如果获取 openid 失败，递归调用自身，最多递归 maxTry 次
     * @param {Object} data 除 code 外的其它请求参数
     * @param {Object} header 请求头
     */
    #getOpenid = (refresh, maxTry, data, header) => {
        return this.login(refresh)
            .then(loginRes => {
                return this.request({
                    url: 'member/openid',
                    data: { code: loginRes.code, ...data },
                    header,
                });
            })
            .then(openidRes => openidRes.data)
            .catch(error => {
                if (maxTry > 1) {
                    return this.#getOpenid(refresh, --maxTry, data, header);
                } else {
                    this.#taskOpenid = null;
                    throw error;
                }
            });
    };

    /**
     * 获取会员信息并缓存，缓存没有再去请求
     * 如果有正在进行的请求，会等待该请求返回而不是再次发送请求
     * 参数可选，不传参数将尝试从 getOpenid 的回调中获取会员信息
     * @param {String} rawData
     * @param {String} signature
     * @param {String} encryptedData
     * @param {String} iv
     */
    getMemberInfo({ rawData, signature, encryptedData, iv } = {}) {
        if (!this.#taskGetMemberInfo) {
            this.#taskGetMemberInfo = this.getOpenid({ all: true })
                .then(openidRes => {
                    if (openidRes.member) {
                        return { data: openidRes.member };
                    } else if (rawData && signature && encryptedData && iv) {
                        const { openid, session_key } = openidRes;
                        return this.request({
                            url: 'member/user',
                            data: {
                                openid,
                                rawData,
                                signature,
                                encryptedData,
                                iv,
                                session_key,
                            },
                            header: {
                                openid,
                            },
                            method: 'POST',
                        });
                    } else {
                        this.#taskGetMemberInfo = null;
                        throw new Error('openid response has no member info.');
                    }
                })
                .then(memberRes => {
                    if (memberRes.data) {
                        return memberRes.data;
                    } else {
                        this.#taskGetMemberInfo = null;
                        throw new Error('member info is null.');
                    }
                })
                .catch(error => {
                    this.#taskGetMemberInfo = null;
                    throw error;
                });
        }
        return this.#taskGetMemberInfo;
    }

    /**
     * 保存用户可发送的订阅消息
     * @param {Array} tmplIds 模板ID数组
     */
    saveSubscribeMessage(tmplIds) {
        return promisic(wx.requestSubscribeMessage)({
            tmplIds,
        })
            .then(async res => {
                const _tmplIds = tmplIds.filter(item => res[item] === 'accept');
                if (_tmplIds.length !== 0) {
                    return this.request({
                        url: 'template/save',
                        method: 'POST',
                        data: { templateId: _tmplIds },
                        header: {
                            openid: await this.getOpenid(),
                        },
                    });
                } else {
                    throw new Error('没有同意的订阅消息');
                }
            })
            .catch(error => {
                throw error;
            });
    }
}

export { AppModel };
