import { HandleCommand } from "../../HandleCommand";
import { HandlerContext } from "../../HandlerContext";
import { HandlerResult } from "../../HandlerResult";
import { Project } from "../../project/Project";
import { LocalOrRemoteRepoOperation } from "../common/LocalOrRemoteRepoOperation";
import { editAll } from "./editAll";
import { EditMode } from "./editModes";
import { ProjectEditor } from "./projectEditor";

/**
 * Support for commands that edit all repos in context,
 * which may come either locally or from GitHub.
 */
export abstract class EditorCommandSupport extends LocalOrRemoteRepoOperation implements HandleCommand {

    public handle(context: HandlerContext, params: this): Promise<HandlerResult> {
        return Promise.resolve(this.projectEditor(context))
            .then(pe =>
                editAll(context, { token: params.githubToken }, pe,
                    this.editInfo,
                    this,
                    params.repoFinder(), params.repoFilter, params.repoLoader()))
            .then(edits => {
                return {
                    code: 0,
                    reposEdited: edits.filter(e => e.edited).length,
                    reposSeen: edits.length,
                };
            });
    }

    /**
     * Return PullRequest or other identification for commit message
     * @param {Project} p
     * @return {EditMode}
     */
    public abstract editInfo(p: Project): EditMode;

    /**
     * Invoked after parameters have been populated in the context of
     * a particular operation. Return an actual editor or a promise,
     * if the editor needs to be created based on the current context.
     */
    public abstract projectEditor(context: HandlerContext): ProjectEditor | Promise<ProjectEditor>;

}
