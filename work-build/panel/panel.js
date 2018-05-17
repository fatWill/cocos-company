'use strict';

var Fs = require("fs");
var Path = require("path");

Editor.Panel.extend({
  template: Fs.readFileSync(Editor.url('packages://work-build/panel/panel.html'), 'utf-8'),

  style: Fs.readFileSync(Editor.url('packages://work-build/panel/panel.css'), 'utf-8'),

  run (cfg) {
    var config = cfg;
    //数据绑定
    new window.Vue({
      el: this.shadowRoot,
      data: {
        isAuto : config.isAuto,
        data : config.data,
      },
      methods: {
        send: function(){
          config.isAuto = this.isAuto;
          if(this.isAuto){
            config.data = this.data;
            Editor.log(this.data.url)
            //判断url路径是否正确
            if(!Path.isAbsolute(config.data.url)){
              Editor.error("请填写正确的绝对路径：" + config.data.url);
              return
            }else{
              var gameURL = Path.join(config.data.url, "game");
              var staticURL = Path.join(config.data.url, "Static");

              try{
                Fs.accessSync(gameURL);
                Fs.accessSync(staticURL);
                Editor.log("Success to config")
              }catch(e){
                Editor.error("请填写正确h5的的svn根路径：" + config.data.url);
                return
              }
            }
          }
          Editor.Ipc.sendToMain('work-build:rev', config);
          Editor.Panel.close('work-build');
        }
      }
    });
  },
  ready () {
    var that = this;
    //点击自动构建的下列面板的显示隐藏
    // this.$switchAuto.addEventListener('click', function(e){
    //   if(this.checked){
    //     that.$isAuto.style.display="block";
    //   }else{
    //     that.$isAuto.style.display="none";
    //   }
    // },false);
    //向主进程发送信息
    // this.$btn.addEventListener('confirm', function(){
    //   config.isAuto = that.$switchAuto.checked;
    //   Editor.log(config.isAuto)
    //   if(config.isAuto){
    //     //存储填选的数据
    //     Editor.log(1111111)
    //     Editor.log(that.$url)
    //     Editor.log(that.$url.value)
    //     config.data = {
    //       url : that.$url.value,
    //       isJs : that.$isJs.checked,
    //       isImport : that.$isImport.checked,
    //       isImage : that.$isImage.checked,
    //       isCovHTML : that.$isCovHTML.checked,
    //       isCovCss : that.$isCovCss.checked,
    //       isCovMAINJS : that.$isCovMAINJS.checked,
    //     }

    //     //判断url路径是否正确
    //     if(!Path.isAbsolute(config.data.url)){
    //       Editor.error("请填写正确的绝对路径：" + config.data.url);
    //       return
    //     }else{
    //       var gameURL = Path.join(config.data.url, "game");
    //       var staticURL = Path.join(config.data.url, "Static");

    //       try{
    //         Fs.accessSync(gameURL);
    //         Fs.accessSync(staticURL);
    //         Editor.log("Success to config")
    //       }catch(e){
    //         Editor.error("请填写正确h5的的svn根路径：" + config.data.url);
    //         return
    //       }
    //     }
    //   }

    //   Editor.Ipc.sendToMain('work-build:rev', config);
      
    //   Editor.Panel.close('work-build');
    // })
  }
});