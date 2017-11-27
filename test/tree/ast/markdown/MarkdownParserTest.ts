import "mocha";
import * as assert from "power-assert";
import { fail } from "power-assert";
import { findMatches, findValues } from "../../../../src/tree/ast/astUtils";

import { evaluateScalarValue } from "@atomist/tree-path/path/expressionEngine";
import * as appRoot from "app-root-path";
import { NodeFsLocalProject } from "../../../../src/project/local/NodeFsLocalProject";
import { InMemoryFile } from "../../../../src/project/mem/InMemoryFile";
import { MarkdownFileParser } from "../../../../src/tree/ast/markdown/MarkdownFileParser";
import { InMemoryProject } from "../../../../src/project/mem/InMemoryProject";

/**
 * Parse sources in this project
 */
describe("MarkdownParser", () => {

    describe("simple parsing", () => {

        it("finds em", done => {
            const p = InMemoryProject.of({path: "README.md", content: "The dog was *big*"});
            findMatches(p, MarkdownFileParser,
                "README.md",
                "//em")
                .then(matchResults => {
                    assert(matchResults.length === 1);
                    assert(matchResults[0].$children.length === 1);
                    const textKid = matchResults[0].$children[0];
                    console.log("textkid=" + JSON.stringify(textKid))
                    assert(textKid.$value === "big");
                    assert(matchResults[0].$value === "*big*");
                    done();
                }).catch(done);
        });

    });

    describe("real project parsing", () => {

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

        it("finds emphasis", done => {
            findMatches(thisProject, MarkdownFileParser,
                "README.md",
                "//em")
                .then(matchResults => {
                    console.log(matchResults.map(m => m.$value).join("\n"));
                    assert(matchResults.length > 0);
                    matchResults.forEach(m => {
                        const em = m as any;
                        console.log(em.$value);
                    });
                    done();
                }).catch(done);
        }).timeout(5000);

        it("finds links", done => {
            findMatches(thisProject, MarkdownFileParser,
                "README.md",
                "//link")
                .then(matchResults => {
                    console.log(matchResults.map(m => m.$value).join("\n"));
                    assert(matchResults.length > 0);
                    matchResults.forEach(m => {
                        const link = m as any;
                        assert(!!link.href);
                        assert(!!link.title);
                    });
                    done();
                }).catch(done);
        }).timeout(5000);

        it("finds linked sites", done => {
            findValues(thisProject, MarkdownFileParser,
                "README.md",
                "//link/href")
                .then(values => {
                    console.log(values.join("\n"));
                    assert(values.length > 0);
                    done();
                }).catch(done);
        }).timeout(5000);

        it("modifies list item");

    });

});
