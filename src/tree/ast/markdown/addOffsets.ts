import { TreeNode } from "@atomist/tree-path/TreeNode";
import { TreeVisitor, visit } from "@atomist/tree-path/visitor";

import * as assert from "power-assert";

// TODO this should go into generic tree support
export function addOffsets(root: TreeNode, content: string) {

    let lastOffset = 0;
    const addOffsetVisitor: TreeVisitor = n => {
        if (n !== root) {
            assert(!!n.$value, `Node named ${n.$name} has no $value`);
            const index = content.indexOf(n.$value, lastOffset);
            (n as any).$offset = index;
            // TODO this can probably fail on repeated elements
            lastOffset = index; // + n.$value.length;
            assert(n.$offset !== undefined, `Node named ${n.$name} still has no $offset`);
            console.log(`Node named ${n.$name} has $offset=${n.$offset} and content [${n.$value}], index=${index}`);
        }
        return true;
    };

    visit(root, addOffsetVisitor);
}
