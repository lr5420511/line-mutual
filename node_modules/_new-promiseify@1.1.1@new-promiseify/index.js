/**
 * 
 * Author: Alex liao
 * 
 * 重写异步函数使之promise化，可以接受多个参数，未遵守nodejs回调函数规范的函数也可以使用此功能
 * 
 * Examples:
 * 
 * 对于遵守nodejs回调函数规范的函数，应该这样调用
 * 
 * const [rdFile, wtFile, stat] = promiseify(fs.readFile, fs.writeFile, fs.stat);
 * const rmdir = promiseify(fs.rmdir);
 * 
 * 对于未遵守nodejs回调函数规范的函数，可以这样调用
 * 
 * const [m1, m2, m3] = promiseify([ms1, 0, 1], ms2, [setTimeout, 0, 1]);
 * [setTimeout, 0, 1] 表示回调函数在参数中的第一个，err不存在，配置为1大于回调函数参数的最大索引
 * 
 * 不能这样调用
 * const [m1, m2, m3] = promiseify([ms1], ms2, [ms3, -1]);
 * 
 * 新增对处于特殊位置回调函数的异步函数的支持（比如velocityjs库）
 * const Veloc = promiseify([
 *     Velocity, function(res) {
 *         const opts = [].slice.call(arguments, 2),
 *             last = opts[opts.length - 1];
 *         last.complete = res;
 *         return opts;
 *     }
 * ]);
 * 
 */

'use strict';

const promiseify = module.exports = function() {
    const [cbInd, errInd] = [
        promiseify.preset.callbackIndex,
        promiseify.preset.errorIndex
    ];
    const methods = [].map.call(arguments, cur => {
        if (!Array.isArray(cur)) cur = [cur, cbInd, errInd];
        const [naiver, cbi, erri] = cur;
        return function() {
            return new Promise((res, rej) => {
                let args = [].slice.call(arguments);
                (typeof cbi == 'function' && (args = cbi(res, rej, ...args))) ||
                (args.splice(cbi < 0 ? args.length : cbi, 0,
                    function() {
                        const args = [].slice.call(arguments),
                            [err] = args.splice(erri, 1);
                        if (err) return rej(err);
                        const len = args.length;
                        return res(!len ? undefined :
                            (len === 1 ? args[0] : args)
                        );
                    }
                ));
                return naiver.apply(this, args);
            });
        };
    });
    return methods.length === 1 ? methods[0] : methods;
};

//default index
promiseify.preset = {
    callbackIndex: -1, //last
    errorIndex: 0
};