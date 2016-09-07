
import tl = require('vsts-task-lib/task');
import tr = require('vsts-task-lib/toolrunner');

import stream = require('stream');
import Q = require('q');

import path = require('path');

var win = tl.osType().match(/^Win/);
tl.debug('win: ' + win);

// extractors
var xpUnzipLocation: string = win ? null : xpUnzipLocation = tl.which('unzip', false);
var winSevenZipLocation: string = path.join(__dirname, '7zip/7z.exe');

export function unzip(file: string, destinationFolder: string) {
    if (win) {
        sevenZipExtract(file, destinationFolder);
    } else {
        unzipExtract(file, destinationFolder);
    }
}

function unzipExtract(file: string, destinationFolder: string) {
    tl.debug('Extracting file: ' + file);
    if (typeof xpUnzipLocation == "undefined") {
        xpUnzipLocation = tl.which('unzip', true);
    }
    var unzip = tl.createToolRunner(xpUnzipLocation);
    unzip.arg(file);
    unzip.arg('-d');
    unzip.arg(destinationFolder);

    return handleExecResult(unzip.execSync(getOptions()), file);
}

function sevenZipExtract(file: string, destinationFolder: string) {
    tl.debug('Extracting file: ' + file);
    var sevenZip = tl.createToolRunner(winSevenZipLocation);
    sevenZip.arg('x');
    sevenZip.arg('-o' + destinationFolder);
    sevenZip.arg(file);
    return handleExecResult(sevenZip.execSync(getOptions()), file);
}

function handleExecResult(execResult: tr.IExecResult, file: string) {
    if (execResult.code != tl.TaskResult.Succeeded) {
        tl.debug('execResult: ' + JSON.stringify(execResult));
        var message = 'Extraction failed for file: ' + file +
            '\ncode: ' + execResult.code +
            '\nstdout: ' + execResult.stdout +
            '\nstderr: ' + execResult.stderr +
            '\nerror: ' + execResult.error;
        throw new UnzipError(message);
    }
}

class StringWritable extends stream.Writable {

    value: string = "";

    constructor(options) {
        super(options);
    }

    _write(data: any, encoding: string, callback: Function): void {
        tl.debug(data);
        this.value += data;
        if (callback) {
            callback();
        }
    }

    toString(): string {
        return this.value;
    }
};

function getOptions(): tr.IExecOptions {
    var execOptions: tr.IExecOptions = {
        silent: true,
        outStream: new StringWritable({ decodeStrings: false }),
        errStream: new StringWritable({ decodeStrings: false }),
    };
    return execOptions;
}

export class UnzipError extends Error {
}