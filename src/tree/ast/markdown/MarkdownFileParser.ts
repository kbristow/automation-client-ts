import { File } from "../../../project/File";

import { PathExpression } from "@atomist/tree-path/path/pathExpression";
import { TreeNode } from "@atomist/tree-path/TreeNode";
import { FileParser } from "../FileParser";

import stringify = require("json-stringify-safe");

import * as assert from "power-assert";

import { AllNodeTest, isNamedNodeTest } from "@atomist/tree-path/path/nodeTests";
import { parse } from "marked-ast";
import { locationSteps } from "../typescript/TypeScriptFileParser";

const Productions = [
    "em", "heading", "list", "listitem",
    "paragraph",
    "link", "href", "title",
    "text"];

/**
 * Parse markdown. Legal productions are heading, list, listitem and paragraph.
 * Headings are hierarchical.
 */
export class MarkdownJsMarkdownFileParser implements FileParser {

    public rootName = "markdown";

    public toAst(f: File): Promise<TreeNode> {
        return f.getContent()
            .then(content => {
                const parsed = parse(content);
                console.log(stringify(parsed));
                const root: TreeNode = {
                    $name: this.rootName,
                    $children: [],
                };
                addNodes(parsed, root);
                return root;
            });
    }

    public validate(pex: PathExpression): void {
        for (const ls of locationSteps(pex)) {
            if (isNamedNodeTest(ls.test) && ls.test !== AllNodeTest) {
                if (!Productions.includes(ls.test.name)) {
                    throw new Error(`Invalid path expression '${stringify(pex)}': ` +
                        `No such Markdown element: '${ls.test.name}'`);
                }
            }
        }
    }
}

export const MarkdownFileParser = new MarkdownJsMarkdownFileParser();

/**
 * Add nodes managing parent stack
 * @param {any[]} nodes flat list of nodes
 * @param {TreeNode} parent
 */
function addNodes(nodes: any[], parent: TreeNode) {
    let headingLevel = 1;
    nodes.map(node => {
        switch (node.type) {
            case "heading" :
                const level = parseInt(node.level, 10);
                if (level >= headingLevel) {
                    const headingNode = new HeadingMarkAstTreeNode(node, parent, level);
                    parent = headingNode;
                } else {
                    // Pop a level
                    parent = parent.$parent;
                    // tslint:disable-next-line no-unused-expression
                    new HeadingMarkAstTreeNode(node, parent, level);
                }
                headingLevel = level;
                assert(!!parent, "Parent undefined in addNodes");
                break;
            case "list" :
                parent.$children.push(new ListMarkAstTreeNode(node, parent));
                break;
            default:
                parent.$children.push(new DefaultMarkAstTreeNode(node, parent));
                break;
        }
    });
}

abstract class AbstractMarkAstTreeNode implements TreeNode {

    public readonly $children = [];

    constructor(protected node: any, public $parent: TreeNode) {
        assert(!!$parent, "Attempt to create MarkAstTreeNode with undefined parent");
    }

    get $name() {
        return this.node.type;
    }

    get $value() {
        return this.node.raw || this.node.text;
    }
}

class HeadingMarkAstTreeNode extends AbstractMarkAstTreeNode {

    constructor(node: any, parent: TreeNode, public readonly level: number) {
        super(node, parent);
        parent.$children.push(this);
    }

}

class ListMarkAstTreeNode extends AbstractMarkAstTreeNode {

    constructor(node: any, parent: TreeNode) {
        super(node, parent);
        node.body.forEach(li => this.$children.push(new DefaultMarkAstTreeNode(li, this)));
    }

}

class DefaultMarkAstTreeNode extends AbstractMarkAstTreeNode {

    constructor(node: any, parent: TreeNode) {
        super(node, parent);
        (node.text || []).forEach(n => {
            if (typeof n === "string") {
                this.$children.push({
                    $name: "text",
                    $value: n,
                });
            } else {
                switch (n.type) {
                    case "link" :
                        // Need two children to allow editing
                        this.$children.push({
                            $name: "link",
                            $value: n.text,
                            href: n.href,
                            $children: [{
                                $name: "href",
                                $value: n.href,
                            }, {
                                $name: "title",
                                $value: n.title,
                            },
                            ],
                        });
                        break;
                    case "em" :
                        console.log("Found em " + JSON.stringify(n));
                        this.$children.push({
                            $name: "em",
                            $value: n.text,
                            $children: [
                                n.text.map(k => ({
                                    $name: "text",
                                    $value: k,
                                })),
                            ],
                        });
                        break;
                }
            }
        });
    }

}

export interface Link extends TreeNode {
    title: string;
    href: string;
}
