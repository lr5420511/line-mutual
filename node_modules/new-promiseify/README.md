# new-promiseify #

  本工具可以让异步函数promise化，未满足nodejs回调函数规范的异步函数也可以使用。新增对于velocityjs等动画库的支持。

#

### 适用范围 ###

+ 仍然在使用回调函数流程的异步函数
+ 遵守nodejs回调函数规范的异步函数
+ 不遵守nodejs回调函数规范的异步函数

#

### 使用方法 ###

       安装：npm i new-promiseify --save

       const promiseify = require('new-promiseify');

       //可以只转换一个函数
       const rmdir = promiseify(fs.rmdir);

       //也可以是多个函数
       const [rdFile, wtFile, mkdir] = promiseify(fs.readFile, fs.writeFile, fs.mkdir);

       //可以满足nodejs回调函数规范
       const [rdFile, wtFile] = promiseify(fs.readFile, fs.writeFile);

       //也可以不满足nodejs回调函数规范
       const [timer, inter] = promiseify([setTimeout, 0, 1], [setInterval, 0, 1]);

       //对于不满足nodejs回调函数规范的参数结构[method, callbackIndex, errorIndex]，需要配置回调函数的索引，error在回调函数参数中的索引
       //如果回调函数参数中不包含error，errorIndex应该配置为大于回调函数参数的最大索引

       //新增对处于特殊位置回调函数的异步函数的支持（比如velocityjs库）
       const Veloc = promiseify([
           Velocity, function(res) {
               const opts = [].slice.call(arguments, 2),
                   last = opts[opts.length - 1];
               last.complete = res;
               return opts;
           }
       ]);

       //我们可以这样去简单调用velocity动画
       (async () => {
           const els = await Veloc([element], { 
             opacity: 0, width: 0, height: 0 
           }, {
             duration: 1000,
             begin: () => console.log('Animate start...')
           });
           console.log(els);
       })()

