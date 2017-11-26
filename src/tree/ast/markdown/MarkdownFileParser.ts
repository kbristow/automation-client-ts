import { File } from "../../../project/File";

import { FileParser } from "../FileParser";
import { TreeNode } from "@atomist/tree-path/TreeNode";
import { PathExpression } from "@atomist/tree-path/path/pathExpression";

import stringify = require("json-stringify-safe");
import { promisify } from "util";

import * as commonmark from "commonmark";

export class MarkdownJsMarkdownFileParser implements FileParser {

    public rootName = "markdown";

    public toAst(f: File): Promise<TreeNode> {
        return f.getContent()
            .then(content => {
                const p = new commonmark.Parser();
                const parsed = p.parse(content);
                console.log(stringify(parsed));
                return new CommonMarkTreeNode(parsed, undefined);
            });
    }

    public validate(pex: PathExpression): void {
    }
}

export const MarkdownFileParser = new MarkdownJsMarkdownFileParser();

class CommonMarkTreeNode implements TreeNode {

    constructor(private node: commonmark.Node, private parent: commonmark.Node) {
        const walker = node.walker();
        const event, node;

        while ((event = walker.next())) {
            node = event.node;
            if (event.entering && node.type === "text") {
                node.literal = node.literal.toUpperCase();
            }
        }
    }

    get $name() {
        return this.node.name;
    }
}