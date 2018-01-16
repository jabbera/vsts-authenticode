import path = require("path");
import ma = require("vsts-task-lib/mock-answer");
import tmrm = require("vsts-task-lib/mock-run");
// import mockTask = require("vsts-task-lib/mock-task");

const taskPath = path.join(__dirname, "..", "entry.js");
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput("signToolLocation", "C:\\signtool.exe");
tr.setInput("retryCount", "1");
tr.setInput("timestampServerDelay", "1");
tr.setInput("timestampServer", "http://timestamp.digicert.com");
tr.setInput("timestampAlgo", "sha256");
tr.setInput("fileAlgo", "sha256");
tr.setInput("certificateLocation", "computerStore");
tr.setInput("certificateSelectionMethod", "auto");
tr.setInput("filePath", "doesntmatter");
tr.setInput("signRootPath", "c:\\temp temp");

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath" : {
        "C:\\signtool.exe": true,
    },
    "findMatch": {
        "doesntmatter": [ "doesntmatter" ],
    },
    "exec": {
        "C:\\signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /sm /a /fd sha256 doesntmatter": {
            "code": 0,
            "stdout": "",
            "stderr": "",
        },
    },
};

tr.setAnswers(a);
tr.registerMock("vsts-task-lib/toolrunner", require("vsts-task-lib/mock-toolrunner"));

tr.run();
