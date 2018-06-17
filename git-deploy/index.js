/*!
 * git-auto-deploy
 * Copyright(c) 2016 Bishal Timilsina
 * MIT Licensed
 */

'use strict';
const spawn = require('child_process').spawn;


/**
*Used to send log on email
*@type {String} serverLog Server log message on command execution, change to add headers to it
*/
var serverLog = '';

/**
*Log buffer data to console and store on serverLog for mail body
*@param {Buffer|String} data
*/
function out(data) {
	console.log(`${data}`);
	serverLog += data
}

/**
 * Module exports.
 * @public
 */

/**
 * Deploy the updates
 * @param  {?Object} repo Repository information
 */
module.exports.deploy = function (repo) {


	/**
	*Git url
	*@type {String} origin Git remote repository url uses origin if none specified
	*@type {String} branch Branch name of remote repository
	*/
	var repo = repo || {
		origin: "origin",
		branch: "master"
	};

	//get the execution path of program
	console.log(`Execution path: ${process.cwd()}`);
	//run shell file for linux
	var pull = spawn("./script.sh", [repo.origin, repo.branch], { cwd: `${__dirname}` });

	//Prints output data
	pull.stdout.on("data", out);
	//Prints errors
	pull.stderr.on("data", out);
	//Send message on end of script execution
	pull.on('close', (code) => {
		console.log(`Child process exited with code ${code}`);
		var subject = "Auto deployment of server completed";


		process.exit(0);

	});
}
