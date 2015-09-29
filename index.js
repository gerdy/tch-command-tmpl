'use strict';
var exec = require('child_process').exec;
exports.name = 'tmpl';
exports.usage = '<command> [options]';
exports.desc = '离线编译dot模板';
exports.register = function(commander) {
    commander
        .option('-e, --verbose', '显示编译日志', Boolean, false)
        .action(function () {
            getConfFile();
            var tmplOpt = fis.config.get("settings.tmpl.options");
            if(!tmplOpt){
                fis.log.notice("离线编译dot的配置不存在,编译中止!");
                fis.log.notice("配置在tch-conf.js的settings.tmpl.options");
                return;
            }
            var pathArr = tmplOpt.path;
            var tmpl = tmplOpt.template;
            var doT = require("../fis-parser-dot/node_modules/dot/index.js"),
                dotFiles = [];
            if(typeof pathArr === "string"){
                dotFiles = fis.util.find(pathArr,'**.dot');
            }else{
                for(var i in pathArr){
                    var path = pathArr[i];
                    dotFiles = dotFiles.concat(fis.util.find(path,'**.dot'));
                }
            }
            for(var n in dotFiles){
                var dotFilePath = dotFiles[n],
                    content = fis.util.read(dotFilePath),
                    contentStr = doT.template(content).toString(),
                    destPath = dotFilePath.replace(/views\/([^\.]+)\.dot/,function($0,$1){
                        return $1+".js";
                    }),
                    data = {},
                    fileContent;
                data.content = contentStr;
                var matchArr = /[^/]*module\/(.*)\.js/.exec(destPath);
                if(matchArr && matchArr[1]){
                    data.id = matchArr[1];
                }else{
                    fis.log.notice("无法获取模板的id,模板编译中断");
                    return;
                }
                fileContent = tmpl.replace(/\${(\w+)}/g,function($0,$1){
                    return data[$1]||"";
                })
                fis.util.write(destPath,fileContent);
            }
        })
};
function getConfFile(){
    var thisPath = fis.util.realpath(process.cwd()),
        filename = "tch-conf.js",
        confFilePath = thisPath+"/"+filename,
        cwd = thisPath,pos = cwd.length,
        root;
    do {
        cwd  = cwd.substring(0, pos);
        if(fis.util.exists(confFilePath)){
            root = cwd;
            break;
        } else {
            confFilePath = false;
            pos = cwd.lastIndexOf('/');
        }
    } while(pos > 0);
    if(!confFilePath){
        fis.log.error("当前目录不存在tch-conf配置文件,请进入对应的子目录下进行构建操作!");
        return;
    }
    fis.project.setProjectRoot(root);
    require(confFilePath);
}
exports.commands = function(){
    var opts = {
    };
    return opts;
}