const promisic = function (callbackAPI) {
    return function (params = {}) {
        return new Promise((resolve, reject) => {
            callbackAPI({
                ...params,
                success: result => resolve(result),
                fail: error => reject(new Error(error.errMsg)),
            });
        });
    };
};

export { promisic };
