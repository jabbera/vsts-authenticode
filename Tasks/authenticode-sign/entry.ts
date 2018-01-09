import * as tr from "vsts-task-lib/ToolRunner";
import * as tl from "vsts-task-lib/task";
import * as sf from "./SecureFileHelpers";

let secureFileId: string = null;
let secureFileHelpers: sf.SecureFileHelpers = null;
async function run() {
    try {
        let signToolLocation: string = getSignToolLocation();
        let retryCount: number = Number(tl.getInput("retryCount", true));

        let signtool: tr.ToolRunner = new tr.ToolRunner(signToolLocation);

        let signtoolArguments: string[] = ["sign"];

        pushTimestampArgs(signtoolArguments);

        await pushCertArgs(signtoolArguments);
        pushFileArgs(signtoolArguments);

        signtool.arg(signtoolArguments);

        let i: number = 0;

        // sometime timestamp servers don't reponse
        while (true) {
            try {
                let exitCode: number = await signtool.exec();
                tl.debug(`Exit code: ${exitCode}`);
                break;
            }
            catch (e) {
                console.log(`Error attempting to sign. Attempt number: ${i++}. Exception text: ${e}`);
                if (i === retryCount) {
                    tl.setResult(tl.TaskResult.Failed, `Unable to sign ${e}`);
                    throw e;
                }
            }
        }
    }
    catch (e) {
        tl.setResult(tl.TaskResult.Failed, `Unable to sign ${e}`);
        throw e;
    }
    finally {
        if (secureFileId && secureFileHelpers) {
            secureFileHelpers.deleteSecureFile(secureFileId);
        }
    }
}

function pushTimestampArgs(args: string[]) {
    let timestampServer: string = tl.getInput("timestampServer", true);
    let timestampAlgo: string = tl.getInput("timestampAlgo", true);

    args.push("/tr", timestampServer, "/td", timestampAlgo);
}

async function pushCertArgs(args: string[]) {
    let certificateLocation: string = tl.getInput("certificateLocation", true);
    if (certificateLocation === "computerStore") {
        args.push("/sm");
        return;
    }

    if (certificateLocation === "userStore") {
        return; // Nothing to do.
    }

    let pfxLocation: string = null;
    if (certificateLocation === "pfxFile") {
        pfxLocation = tl.getPathInput("pfxFile", true);
    }

    if (certificateLocation === "secureFile") {
        secureFileId = tl.getInput("pfxSecureFile", true);
        secureFileHelpers = new sf.SecureFileHelpers();
        pfxLocation = await secureFileHelpers.downloadSecureFile(secureFileId);
    }

    if (pfxLocation == null || pfxLocation === "") {
        let error: string = `Pfx Location not set. certificateLoation:'${certificateLocation}'`;
        tl.setResult(tl.TaskResult.Failed, error);
        throw error;
    }

    tl.checkPath(pfxLocation, "pfxfile");

    let pfxPassword: string = tl.getInput("pfxPassword");
    if (pfxPassword == null || pfxPassword === "") {
        let error: string = "Pfx Password not set.";
        tl.setResult(tl.TaskResult.Failed, error);
        throw error;
    }

    args.push("/f", pfxLocation, "/p", pfxPassword);
}

function pushFileArgs(args: string[]) {
    let fileAlgo: string = tl.getInput("fileAlgo", true);
    let filePaths: string[] = tl.getDelimitedInput('filePaths', '\n', true);

    args.push("/fd", fileAlgo, "/a");
    Array.prototype.push.apply(args, filePaths);
}

function getSignToolLocation(): string {
    let toolLocation: string = tl.getInput("toolLocation", false);
    if (toolLocation != null && toolLocation !== "") {
        tl.debug(`custom signtool location: ${toolLocation}`);
        return toolLocation;
    }

    let platform: string = getPlatformFolder();
    if (platform != null && platform !== "") {
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
    if (platform != null && platform !== "") {
        tl.debug("Wow64 detected");
    }
    else {
        platform = process.env["PROCESSOR_ARCHITECTURE"];
        if (platform == null || platform === "") {
            console.log("No platform detected");
            platform = "x86";
        }
    }

    platform = platform.toUpperCase();

    let folder: string = "x86"; // Default'
    switch (platform) {
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