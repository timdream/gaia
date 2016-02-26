'use strict';

/* global require, exports */

var utils = require('utils');

var KeyboardConfigStatus = function(distDirPath) {
  this.config =
    utils.getJSON(utils.getFile(distDirPath, 'build', 'config.json'));
  this.graph = {};
};

KeyboardConfigStatus.prototype.insertCommand =
function insertCommand(target, deps, commands) {
  if (!target) {
    throw new Error('Need a target.');
  }

  if (!(target in this.graph)) {
    this.graph[target] = {
      deps: [],
      commands: []
    };
  }

  if (deps) {
    this.graph[target].deps = this.graph[target].deps.concat(deps);
  }
  if (commands) {
    this.graph[target].commands = this.graph[target].commands.concat(commands);
  }
};

KeyboardConfigStatus.prototype.setConfigFiles = function() {
  this.insertCommand(
    this.config.distDir + '/config.json',
    this.config.appDir + '/build/configure.js',
    ['@echo STOP! Configure has changed. Please re-run from source dir.',
    '@echo 1']
  );

  this.insertCommand(
    this.config.distDir + '/config.status.js',
    this.config.appDir + '/build/config.status.in.js',
    ['@echo STOP! Configure has changed. Please re-run from source dir.',
    '@echo 1']
  );
};

KeyboardConfigStatus.prototype.setStaticFilesToCopy = function() {
  var staticFiles = [
    'index.html',
    'locales/*',
    'settings.html',
    'style/*',
    'js/settings/*',
    'js/shared/*',
    'js/keyboard/*',
    'js/views/*'
  ];

  var filename;
  while (filename = staticFiles.shift()) {
    var filenameArr = filename.split('/');

    if (filenameArr[filenameArr.length - 1] !== '*') {
      this.insertCommand(
        this.config.distDir + '/' + filename,
        this.config.appDir + '/' + filename,
        'cp "' + this.config.appDir + '/' + filename + '" "' +
          this.config.distDir + '/' + filename + '"');
    } else {
      filenameArr.pop();

      utils.ls(filenameArr.join('/'), false).forEach(function(file) {
        if (file.isDirectory()) {
          staticFiles.push(filenameArr.join('/') + '/' + file.leafName + '/*');
        } else {
          staticFiles.push(filenameArr.join('/') + '/' + file.leafName);
        }
      });
    }
  }
};

KeyboardConfigStatus.prototype.execute = function() {
  this.setConfigFiles();
  this.setStaticFilesToCopy();
  this.setLayoutsToCopy();
  this.setLayoutsJSONToGenerate();
  this.setManifestToGenerate();
  this.setSettingsToModify();
};

