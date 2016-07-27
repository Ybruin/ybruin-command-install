'use strict';

exports.name = 'install';
exports.usage = '[options] <components...>';
exports.desc = 'install components';

var fs = require('fs');
var path = require('path');
var request = require('request');
var stream = process.stdout;
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
                var json = require(path.resolve(config));
                var commonsGitPath = 'http://res.cont.yy.com/components/commons/';
                //删除目录
                deleteFolderRecursive(compFolder);
                //commons组件
                request(commonsGitPath + 'component.json', function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            !exists(compFolder) && fs.mkdirSync(compFolder);
                            var files = JSON.parse(body).files;
                            var commonsPath = path.join(compFolder, 'commons');
                            !exists(commonsPath) && files.length > 0 && fs.mkdirSync(commonsPath);
                            files.forEach(function(item) {
                                request
                                    .get(commonsGitPath + item)
                                    .on('response', function(res) {
                                        if (res.statusCode != 200) {
                                            stream.write('commons/' + item + '  下载失败\n'.red.bold);
                                        }
                                    })
                                    .on('error', function(err) {
                                        console.log(err);
                                    })
                                    .on('end', function() {
                                        stream.write('commons/' + item + '  下载完成\n'.green.bold);
                                    })
                                    .pipe(fs.createWriteStream(path.join(commonsPath, item)))
                            })
                        }
                    })
                    //依赖组件
                for (var compName in json) {
                    (function(compName) {
                        var compGitPath = 'http://res.cont.yy.com/components/' + compName + '/' + json[compName] + '/';
                        request(compGitPath + 'component.json', function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                                !exists(compFolder) && fs.mkdirSync(compFolder);
                                var compPath = path.join(compFolder, compName);
                                var files = JSON.parse(body).files;
                                !exists(compPath) && files.length > 0 && fs.mkdirSync(compPath);
                                files.forEach(function(item) {
                                    request
                                        .get(compGitPath + item)
                                        .on('response', function(res) {
                                            if (res.statusCode != 200) {
                                                stream.write(compName + '/' + item + '  下载失败\n'.red.bold);
                                            }
                                        })
                                        .on('error', function(err) {
                                            console.log(err);
                                        })
                                        .on('end', function() {
                                            stream.write(compName + '/' + item + '  下载完成\n'.green.bold);
                                        })
                                        .pipe(fs.createWriteStream(path.join(compPath, item)))
                                })
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
