import path = require("path");
import ma = require("vsts-task-lib/mock-answer");
import tmrm = require("vsts-task-lib/mock-run");
// import mockTask = require("vsts-task-lib/mock-task");

const taskPath = path.join(__dirname, "..", "entry.js");
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput("signToolLocation", "C:\\vsts-authenticode\\Tasks\\authenticode-sign\\x64\\signtool.exe");
tr.setInput("retryCount", "1");
tr.setInput("timestampServerDelay", "1");
tr.setInput("timestampServer", "http://timestamp.digicert.com");
tr.setInput("timestampAlgo", "sha256");
tr.setInput("fileAlgo", "sha256");
tr.setInput("certificateLocation", "pfxFile");
tr.setInput("pfxFile", "c:\\vsts-authenticode\\Test\\a.pfx");
tr.setInput("pfxPassword", "password");
tr.setInput("filePath", "**/*.exe\n**/*.dll");
tr.setInput("signRootPath", "c:\\temp temp");

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath" : {
        "C:\\vsts-authenticode\\Tasks\\authenticode-sign\\x64\\signtool.exe": true,
        "c:\\vsts-authenticode\\Test\\a.pfx": true,
    },
    "findMatch": {
        "**/*.exe\n**/*.dll": [
            "c:\\temp temp\\a.dll",
            "c:\\temp temp\\b.exe",
        ],
    },
    "exec": {
        "C:\\vsts-authenticode\\Tasks\\authenticode-sign\\x64\\signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /f c:\\vsts-authenticode\\Test\\a.pfx /p password /fd sha256 c:\\temp temp\\a.dll c:\\temp temp\\b.exe": {
            "code": 0,
            "stdout": "",
            "stderr": "",
        },
    },
};

tr.setAnswers(a);
tr.registerMock("vsts-task-lib/toolrunner", require("vsts-task-lib/mock-toolrunner"));

tr.run();