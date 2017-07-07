import * as tl from "vsts-task-lib/task";
import * as tr from "vsts-task-lib/ToolRunner";

async function run() {
    let signToolLocation: string = getSignToolLocation();
    let timestampServer: string = tl.getInput("timestampServer", true);
    let timestampAlgo: string = tl.getInput("timestampAlgo", true);
    let fileAlgo: string = tl.getInput("fileAlgo", true);
    let filePath: string = tl.getInput("filePath", true);
    let retryCount: number = Number(tl.getInput("retryCount", true));

    let signtool: tr.ToolRunner = new tr.ToolRunner(signToolLocation);
    
    signtool.arg([ "sign", "/tr", timestampServer, "/td", timestampAlgo, "/fd", fileAlgo, "/a", filePath ]);

    let i: number = 0;
    
    // sometime timestamp servers don't reponse
    while(true) {
        try
        {
            var exitCode: number = await signtool.exec();
            tl.debug(`Exit code: ${exitCode}`);
            break;
        }
        catch(e) {
            console.log(`Error attempting to sign. Attempt number: ${i++}. Exception text: ${e}`);
            if (i == retryCount) {
                tl.setResult(tl.TaskResult.Failed, `Unable to sign ${e}`);
                throw e;
            }
        }
    }

}

function blah(): string {
    
}

function getSignToolLocation(): string {
    let toolLocation: string = tl.getInput("toolLocation", false);
    if (toolLocation != null && toolLocation != "") {
        tl.debug(`custom signtool location: ${toolLocation}`)
        return toolLocation;
    }
    
    let platform: string = getPlatformFolder();
    if (platform != null && platform != '') {
        toolLocation = `${__dirname}\\${platform}\\signtool.exe`;
        tl.debug(`Using tool location: ${toolLocation}`);
        tl.checkPath(toolLocation, "signtool.exe");
        return toolLocation;
    }
    

    tl.setResult(tl.TaskResult.Failed, "Unable to locate signtool.exe");
    return null;
}

function getPlatformFolder(): string {
    let platform: string = process.env["PROCESSOR_ARCHITEW6432"];
    if (platform != null && platform != "") {
        tl.debug("Wow64 detected");
    }
    else {
        platform = process.env["PROCESSOR_ARCHITECTURE"];
        if (platform == null || platform == '') {
            console.log("No platform detected");
            platform = "x86";
        }
    }

    platform = platform.toUpperCase();
    
    let folder: string = "x86"; // Default'
    switch(platform) {
        case "AMD64":
            folder = "x64";
            break;
        case "X86":
            folder = "x86";
            break;
        default:
            console.log(`Unknown platform: ${platform}`);
    }

    return folder;
}

run();