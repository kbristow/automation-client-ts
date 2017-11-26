import "mocha";
import * as assert from "power-assert";
import { findMatches, findValues } from "../../../../src/tree/ast/astUtils";

import * as appRoot from "app-root-path";
import { NodeFsLocalProject } from "../../../../src/project/local/NodeFsLocalProject";
import { MarkdownFileParser } from "../../../../src/tree/ast/markdown/MarkdownFileParser";
import { InMemoryFile } from "../../../../src/project/mem/InMemoryFile";
import { evaluateScalarValue } from "@atomist/tree-path/path/expressionEngine";
import { fail } from "power-assert";

/**
 * Parse sources in this project
 */
describe("MarkdownParser real project parsing", () => {

    const thisProject = new NodeFsLocalProject("automation-client", appRoot.path);

    it("should reject invalid path expression", done => {
        const f = new InMemoryFile("script.ts", "const x = 1;");
        MarkdownFileParser
            .toAst(f)
            .then(root => {
                try {
                    evaluateScalarValue(root, "//xxParagraph");
                    fail("Should have rejected invalid path expression");
                } catch (e) {
                    // Ok
                    done();
                }
            }).catch(done);
    });

    it("finds headings", done => {
        findMatches(thisProject, MarkdownFileParser,
            "README.md",
            "//heading")
            .then(matchResults => {
                console.log(matchResults.map(m => m.$value).join("\n"));
                assert(matchResults.length > 0);
                done();
            }).catch(done);
    }).timeout(5000);

    it("finds headings by level", done => {
        findMatches(thisProject, MarkdownFileParser,
            "README.md",
            // TODO should be able to run predicate with number
            "//heading[?level1]",
            {level1: n => n.level === 1})
            .then(matchResults => {
                console.log(matchResults.map(m => m.$value).join("\n"));
                assert(matchResults.length > 0);
                done();
            }).catch(done);
    }).timeout(5000);

    it("finds list items", done => {
        findMatches(thisProject, MarkdownFileParser,
            "README.md",
            "//list/listitem")
            .then(matchResults => {
                console.log(matchResults.map(m => m.$value).join("\n"));
                assert(matchResults.length > 0);
                done();
            }).catch(done);
    }).timeout(5000);

    it("modifies list item");

});
