'use strict';

exports.name = 'install';
exports.usage = '[options] <components...>';
exports.desc = 'install components';

var fs = require('fs');
var path = require('path');
var url = require('url');
var request = require('request');
var log = require('./lib/log.js');
var exists = fs.existsSync;
var write = fs.writeFileSync;
var compFolder = path.resolve('components');

exports.register = function(commander) {

    commander
        .option('-r, --root <path>', 'set project root')
        .option('-f, --config <file>', 'set components config file')
        .action(function() {
            var args = [].slice.call(arguments);
            var options = args.pop();
            var settings = {
                root: options.root || '',
                config: options.config || 'components.json',
                components: args.concat()
            };
            //读取components配置文件
            var config = path.join(settings.root, settings.config);
            if (!exists(config)) {
                throw new Error('missing `components.json`');
            } else {
                var configData = require(path.resolve(config));
                var compUrl = configData.url;
                var compDeps = configData.deps;
                var commonsOnlinePath = url.resolve(compUrl, 'commons/');
                //删除目录
                deleteFolderRecursive(compFolder);
                //commons组件
                var commonsJson = url.resolve(commonsOnlinePath, 'component.json');
                request(commonsJson, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        !exists(compFolder) && fs.mkdirSync(compFolder);
                        var files = JSON.parse(body).files;
                        var commonsLocalPath = path.join(compFolder, 'commons');
                        !exists(commonsLocalPath) && files.length > 0 && fs.mkdirSync(commonsLocalPath);
                        files.forEach(function(item) {
                            request
                                .get(url.resolve(commonsOnlinePath, item))
                                .on('response', function(res) {
                                    if (res.statusCode != 200) {
                                        log.error('commons/' + item + '  下载失败'.red);
                                    }
                                })
                                .on('error', function(err) {
                                    console.log(err);
                                })
                                .on('end', function() {
                                    log.notice('commons/' + item + '  下载成功'.green);
                                })
                                .pipe(fs.createWriteStream(path.join(commonsLocalPath, item)))
                        })
                    } else {
                        log.error(error || response.statusCode)
                    }
                })
                    //依赖组件
                for (var compName in compDeps) {
                    (function(compName) {
                        var compOnlinePath = url.resolve(compUrl, path.join(compName, compDeps[compName], '/'));
                        var compJson = url.resolve(compOnlinePath, 'component.json');
                        request(compJson, function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                                !exists(compFolder) && fs.mkdirSync(compFolder);
                                var compLocalPath = path.join(compFolder, compName);
                                var files = JSON.parse(body).files;
                                !exists(compLocalPath) && files.length > 0 && fs.mkdirSync(compLocalPath);
                                files.forEach(function(item) {
                                    request
                                        .get(url.resolve(compOnlinePath, item))
                                        .on('response', function(res) {
                                            if (res.statusCode != 200) {
                                                log.error(compName + '/' + item + '  下载失败'.red);
                                            }
                                        })
                                        .on('error', function(err) {
                                            console.log(err);
                                        })
                                        .on('end', function() {
                                            log.notice(compName + '/' + item + '  下载成功'.green);
                                        })
                                        .pipe(fs.createWriteStream(path.join(compLocalPath, item)))
                                })
                            } else {
                                log.error(error || response.statusCode)
                            }
                        })
                    })(compName)
                }
            }
        });
    var deleteFolderRecursive = function(path) {

        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);

            files.forEach(function(file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) { // recurse

                    deleteFolderRecursive(curPath);

                } else { // delete file

                    fs.unlinkSync(curPath);

                }
            });

            fs.rmdirSync(path);

        }
    };
};