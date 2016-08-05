'use strict';
//日志输出信息

module.exports = {
	debug: function(msg) {
		process.stdout.write('\n ' + '[DEBUG]'.grey + ' ' + msg + '\n');
	},
	notice: function(msg) {
		process.stdout.write('\n ' + '[INFO]'.cyan + ' ' + msg + '\n');
	},
	warning: function(msg) {
		process.stdout.write('\n ' + '[WARNI]'.yellow + ' ' + msg + '\n');
	},
	error: function(msg) {
		process.stdout.write('\n ' + '[ERROR]'.red + ' ' + msg + '\n');
	}
}