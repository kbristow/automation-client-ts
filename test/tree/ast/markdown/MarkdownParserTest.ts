
import "mocha";
import * as assert from "power-assert";
import { findMatches, findValues } from "../../../../src/tree/ast/astUtils";;

import * as appRoot from "app-root-path";
import { NodeFsLocalProject } from "../../../../src/project/local/NodeFsLocalProject";
import { MarkdownFileParser } from "../../../../src/tree/ast/markdown/MarkdownFileParser";

/**
 * Parse sources in this project
 */
describe("MarkdownParser real project parsing: JavaScript", () => {

    const thisProject = new NodeFsLocalProject("automation-client", appRoot.path, () => Promise.resolve());

    it("should parse sources from project and use a path expression to find values", done => {
        findMatches(thisProject, MarkdownFileParser,
            "build/src/tree/ast/typescript/*.js",
            "//ClassDeclaration/Identifier")
            .then(matchResults => {
                assert(matchResults.length > 0);
                //assert(matchResults.map(m => m.$value).includes(TypeScriptFileParser.name));
                done();
            }).catch(done);
    }).timeout(5000);

    // it("should parse sources from project and use a path expression to find values using convenience method", done => {
    //     findValues(thisProject, TypeScriptES6FileParser,
    //         "build/src/tree/ast/typescript/*.js",
    //         "//ClassDeclaration/Identifier")
    //         .then(values => {
    //             assert(values.includes(TypeScriptFileParser.name));
    //             done();
    //         }).catch(done);
    // }).timeout(5000);

});
