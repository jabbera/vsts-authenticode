import * as tl from "azure-pipelines-task-lib/task";
import * as tr from "azure-pipelines-task-lib/toolrunner";
import * as sf from "./SecureFileHelpers";

let secureFileId: string = null;
let secureFileHelpers: sf.SecureFileHelpers = null;
async function run() {
    try {
        let signToolLocation: string = getSignToolLocation();
        let retryCount: number = Number(tl.getInput("retryCount", true));
        let timestampServerDelay: number = Number(tl.getInput("timestampServerDelay", true));

        let signtool: tr.ToolRunner = new tr.ToolRunner(signToolLocation);

        let signtoolArguments: string[] = ["sign"];

        pushTimestampArgs(signtoolArguments);

        await pushCertArgs(signtoolArguments);
        pushAdditionalArgs(signtoolArguments);
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

                await sleepFor(timestampServerDelay);

                if (i >= retryCount) {
                    tl.setResult(tl.TaskResult.Failed, `Unable to sign ${e}`);
                    throw e;
                }
            }
        }
    }
    catch (e) {
        tl.setResult(tl.TaskResult.Failed, `Unable to sign ${e}`);
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

function pushCertStoreArgs(certificateLocation: string, args: string[]): boolean {
    switch (certificateLocation) {
        case "computerStore":
            args.push("/sm");
        case "userStore":
            let certificateSelectionMethod: string = tl.getInput("certificateSelectionMethod", true);
            if (certificateSelectionMethod === "auto") {
                args.push("/a");
            }

            if (certificateSelectionMethod === "sha1") {
                args.push("/sha1", tl.getInput("certificateThumbprint", true));
            }

            return true;
        default:
            return false;
    }
}

async function pushCertArgs(args: string[]) {
    let certificateLocation: string = tl.getInput("certificateLocation", true);
    if (pushCertStoreArgs(certificateLocation, args)) {
        // Handled by the above method
        return;
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
    let filePath: string[] = tl.getDelimitedInput("filePath", "\n", true);
    let rootPath: string = tl.getInput("signRootPath", true);

    let options: tl.MatchOptions = {
        debug: false,
        dot: true,
        nobrace: true,
        nocase: process.platform === "win32",
    };

    let matchedFiles: string[] = tl.findMatch(rootPath, filePath, null, options);

    args.push("/fd", fileAlgo);

    Array.prototype.push.apply(args, matchedFiles);
}

function pushAdditionalArgs(args: string[]) {
    let additionalArgs: string[] = tl.getDelimitedInput("additionalArguments", "\n", false);
    if (additionalArgs === null || additionalArgs.length === 0) {
        return;
    }

    Array.prototype.push.apply(args, additionalArgs);
}

function getSignToolLocation(): string {
    let toolLocation: string = tl.getInput("signToolLocation", false);
    if (toolLocation != null && toolLocation !== "") {
        tl.debug(`custom signtool location: ${toolLocation}`);
        tl.checkPath(toolLocation, "custom tool location");
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

async function sleepFor(sleepDurationInSeconds): Promise<any> {
    console.log(`Sleeping for ${sleepDurationInSeconds} second(s)`);

    return new Promise((resolve) => {
        setTimeout(resolve, sleepDurationInSeconds * 1000);
    });
}


run();
