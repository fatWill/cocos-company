'use strict';

var Fs = require("fs");
var Path = require("path");
var Exec = require('child_process').exec;

//rev config
var config = {
  isAuto : false,   //是否启用自动构建
  data : {
    url: "",
    isJs : false,  //是否移植js文件
    isImport : false,  //是否移植import文件
    isImage : false,  //是否移植image文件
    isCovHTML : false,  //是否覆盖index.html
    isCovCss : false,  //是否覆盖stype-mobile.css
    isCovMAINJS : false,  //是否覆盖main.js
    isRmDir : false,  //是否删除cocos的打包目录
  }
};
/**
 * !#zh 异步读取遍历目录的方法并且读取转移文件的方法
 * @method travel
 * @param {Path} dir 读取的目录
 * @param {Path} transDir 需要转移的目录
 * @param {function} finish 全部结束后的回调
 */
var travel = function(dir, transDir, finish) {
  Fs.readdir(dir,function (err, files) {
    if (err) throw err;
    (function next(i) {
      if(i < files.length) {
        var pathname = Path.join(dir, files[i]);
        var _transDir = Path.join(transDir, files[i])

        Fs.stat(pathname,function (err, stats) {
          if (err) throw err;

          if(stats.isDirectory()) {
            
            //判断与创建目录
            Fs.access(_transDir, function(err){
              if(err) Fs.mkdir(_transDir);
            })

            travel(pathname, _transDir, function () {
              next(i + 1);
            });
          }else {
            Fs.readFile(pathname, function (err, data) {
              if (err) throw err;
              Fs.writeFile(_transDir, data, function(err, data){
                if (err) throw err;
                Editor.log("Success to copy " + pathname);
              })
            })
            
            next(i + 1);
          }
        });
      }else {
        finish && finish();
      }
    }(0));
  });
}

/**
 * !#zh 递归创建目录
 * @method travel
 * @param {Path} dirname 要递归创建的目录
 */
var mkdirs = function(dirname, callback) {  
    Fs.access(dirname, function (err) {  
        if (!err) {
          callback && callback()
        } else { 
          mkdirs(Path.dirname(dirname), function () {
              Fs.mkdir(dirname, callback);  
          });  
        }  
    });  
}

module.exports = {
  load () {
    // 当 package 被正确加载的时候执行
    // Editor.assetdb.import(['http://letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/global.min.js'], 'db://assets/script', function ( err, results ) {
    //   results.forEach(function ( result ) {
    //   // result.uuid
    //   // result.parentUuid
    //   // result.url
    //   // result.path
    //   // result.type
    //   });
    // });
  },

  unload () {
    // 当 package 被正确卸载的时候执行
  },

  messages: {
    //监听打包结束
    'editor:build-finished' : function (event, target) {

      if(!config.isAuto) return

      //读取文件路径
      var _root = Path.normalize(target.dest);

      //配置好文件目录，取出文件目录
      var workUrl = config.data.url;
      if (!workUrl) return

      //标题和版本，所有设置的目录和路径都要与标题与版本有关
      var title = target.title;
      var version = "cocos-v" + Editor.versions.cocos2d;

      //读取main.js文件
      if(config.data.isCovMAINJS){
        var mainjs = Path.join(_root, "main.js");
        Fs.readFile(mainjs, function (err, data) {
          if (err) throw err;
          var fileData = data.toString();
          //修改cocos的全局引用
          fileData = fileData.replace(/cocos2d-js\.js/g, "//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/" + version + "/cocos2d-js.js");
          fileData = fileData.replace(/cocos2d-js-min\.js/g, "//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/" + version + "/cocos2d-js-min.js");

          //修改project引用 并在引用前加上title
          fileData = fileData.replace(/src\/project\.dev\.js/g, "//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/" + version + "/" + title + "/project.dev.js");
          fileData = fileData.replace(/src\/project\.js/g, "//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/" + version + "/" + title + "/project.js");

          //包引用修改
          fileData = fileData.replace(/res\/import/g, "//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/" + version + "/" + title + "/import");

          //图片资源引用
          fileData = fileData.replace(/res\/raw-/g, "//letoula-static.oss-cn-shenzhen.aliyuncs.com/images/v1.0/game/" + title + "/raw-");

          var p = Path.join(workUrl, "Static/js/v1.0/game/" + version + "/" + title);
          mkdirs(p, function(){
            var pathname = Path.join(p, "main.js");
            try{
              Fs.accessSync(pathname)
            }catch(e){
              //修改main.js文件
              Fs.writeFile(pathname, fileData, function(err, data){
                if (err) throw err;
                Editor.log("Success to change main.js")
              })
            }
          }) 
        });
      }

      //读取index.html文件
      if(config.data.isCovHTML){
        var indexhtml = Path.join(_root, "index.html");
        Fs.readFile(indexhtml, function (err, data) {
          if (err) throw err;
          var fileData = data.toString();
          //添加依赖引用的js
          var jsArr = [
                        '<script type="text/javascript" src="//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/config.js" charset="utf-8"></script>',
                        '<script type="text/javascript" src="//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/h5config.js" charset="utf-8"></script>',
                        '<script type="text/javascript" src="//letoula-static.oss-cn-shenzhen.aliyuncs.com/lib/axios/axios.min.js" charset="utf-8"></script>',
                        '<script type="text/javascript" src="//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/global.min.js" charset="utf-8"></script>',
                        '<script type="text/javascript" src="//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/' + version + '/' + title + '/settings.js" charset="utf-8"></script>',
                        '<script type="text/javascript" src="//letoula-static.oss-cn-shenzhen.aliyuncs.com/js/v1.0/game/' + version + '/' + title + '/main.js" charset="utf-8"></script>'
                      ];

          //删除所有的js引用
          fileData = fileData.replace(/(<script[^>]*><\/script\s*>)/gi, '');

          // 添加上述依赖的js
          fileData = fileData.replace(/(<\/body\s*>)/i, function(str){
            return jsArr.join('\n') + '\n' + str;
          })

          //修改style-mobile.css引用
          fileData = fileData.replace(/style-mobile\.css/, "//letoula-static.oss-cn-shenzhen.aliyuncs.com/css/v1.0/game/" + title + "/style-mobile.css");

          //h5目录的html文件储存
          var p = Path.join(workUrl, "game/" + title);
          mkdirs(p, function(){
            var pathname = Path.join(p, "index.html");
            try{
              Fs.accessSync(pathname)
            }catch(e){
              //修改index.html文件
              Fs.writeFile(pathname, fileData, function(err, data){
                if (err) throw err;
                Editor.log("Success to change index.html");
              })
            }
          })
          
        })
      }

      //读取style.mobile.css文件
      if(config.data.isCovCss){
        var stylecss = Path.join(_root, "style-mobile.css");
        Fs.readFile(stylecss, function (err, data) {
          var p = Path.join(workUrl, "Static/css/v1.0/game/" + title);
          mkdirs(p, function(){
            var pathname = Path.join(p, "style-mobile.css");
            try{
              Fs.accessSync(pathname)
            }catch(e){
              Fs.writeFile(pathname, data, function(err, data){
                if (err) throw err;
                Editor.log("Success to change style-mobile.css");
              })
            }
          })
        })
      }

      //移植文件
      //h5目录的静态路径
      var stic = Path.join(workUrl, "static");

      //转移js文件
      if(config.data.isJs){
        var src = Path.join(_root, "src");
        var _src = Path.join(stic, "js/v1.0/game/" + version + "/" + title);
        mkdirs(_src,function(){
          travel(src, _src)
        })
      }

      //转移import
      if(config.data.isImport){
        var imp = Path.join(_root, "res/import");
        var _imp = Path.join(stic, "js/v1.0/game/" + version + "/" + title + "/import");
        
        Exec('rm -rf ' + _imp,function(){
          mkdirs(_imp,function(){
            travel(imp, _imp)
          })
        })
      }

      //转移image
      if(config.data.isImage){
        var rawAssets = Path.join(_root, "res/raw-assets");
        var _rawAssets = Path.join(stic, "images/v1.0/game/" + title + "/raw-assets");
        Exec('rm -rf ' + _rawAssets,function(){
          mkdirs(_rawAssets,function(){
            travel(rawAssets, _rawAssets)
          })
        })

        //转移defalut sprite png
        var rawInternal = Path.join(_root, "res/raw-internal");
        var _rawInternal = Path.join(stic, "images/v1.0/game/" + title + "/raw-internal");
        Exec('rm -rf ' + _rawInternal,function(){
          mkdirs(_rawInternal,function(){
            travel(rawInternal, _rawInternal)
          })
        })
      }

      //删除打包文件
      if(config.data.isRmDir){
        // Exec('rm -rf ' + _root, function(){
      //     Editor.log("Success ro delete cocos package")
        // }
      }

    },
    //监听编辑器刷新
    // 'scene:reloading' : function(){
    //   Editor.log(1)
    // },
    //猴彩配置打开
    open () {
        Editor.Panel.open('work-build',config);
    },
    //接受配置信息
    rev (e, data) {
      config = data;
    }
  },
};

