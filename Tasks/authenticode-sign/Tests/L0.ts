
import { expect } from "chai";
import "mocha";
import path = require("path");
import * as ttm from "vsts-task-lib/mock-test";

/* tslint:disable:no-unused-expression */

describe("Authenticode sign test suite", () => {

  it("custom tool location works", (done) => {
    const testPath: string = path.join(__dirname, "L0CustomToolNotFound.js");
    const testRunner: ttm.MockTestRunner = new ttm.MockTestRunner(testPath);

    testRunner.run();

    expect(testRunner.failed).true;
    expect(testRunner.errorIssues).includes("Unable to sign Error: Not found c:\\signtool.exe");
    done();
  });

});