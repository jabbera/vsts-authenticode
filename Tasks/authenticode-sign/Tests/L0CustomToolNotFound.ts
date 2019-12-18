import path = require("path");
import ma = require("azure-pipelines-task-lib/mock-answer");
import tmrm = require("azure-pipelines-task-lib/mock-run");
// import mockTask = require("azure-pipelines-task-lib/mock-task");

const taskPath = path.join(__dirname, "..", "entry.js");
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput("signToolLocation", "c:\\signtool.exe");

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath" : {
        "c:\\signtool.exe": false,
    },
};

tr.setAnswers(a);
tr.run();