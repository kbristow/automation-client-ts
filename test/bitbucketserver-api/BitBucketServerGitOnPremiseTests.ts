import {BasicAuthCredentials} from "../../src/operations/common/BasicAuthCredentials";
import {BitBucketServerRepoRef} from "../../src/operations/common/BitBucketServerRepoRef";
import {GitCommandGitProject} from "../../src/project/git/GitCommandGitProject";
import {GitProject} from "../../src/project/git/GitProject";
import {TestRepositoryVisibility} from "../credentials";
import {tempProject} from "../project/utils";

export const BitBucketServerUsername = "username";
export const BitBucketServerPassword = "password";

export const BitBucketServerCredentials = {
    username: BitBucketServerUsername,
    password: BitBucketServerPassword,
} as BasicAuthCredentials;

export const bitBucketRemoteBase = "bitbucket.organisation.co.za";
export const owningProject = "project-name";
export const seedApplicationName = "app-name";

describe("BitBucketServer support on premises testing ", () => {

    it("should clone", done => {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        GitCommandGitProject.cloned(BitBucketServerCredentials,
            new BitBucketServerRepoRef(bitBucketRemoteBase, owningProject, seedApplicationName))
            .then(bp => bp.gitStatus())
            .then(() => done(), done);
    }).timeout(15000);

    it("should clone and add file in new branch", () => {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        return doWithNewRemote(bp => {
            bp.addFileSync("Thing", "1");
            return bp.commit("Added Thing1")
                .then(() => {
                    return bp.createBranch("thing1")
                        .then(() => bp.push());
                });
        });
    }).timeout(20000);

    it("should clone and add file in new branch then raise PR", () => {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        return doWithNewRemote(bp => {
            bp.addFileSync("Thing", "1");
            return bp.commit("Added Thing1")
                .then(ar => bp.createBranch("thing1"))
                .then(() => bp.push())
                .then(() => bp.raisePullRequest("Add a thing", "Dr Seuss is fun"));
        });
    }).timeout(20000);

    it("add a file, init and commit, then push to new remote repo", () => {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        return doWithNewRemote(bp => {
            return bp.gitStatus();
        });
    }).timeout(20000);
});

function doWithNewRemote(testAndVerify: (p: GitProject) => Promise<any>) {
    const p = tempProject();
    p.addFileSync("README.md", "Here's the readme for my new repo");

    const repo = `test-${new Date().getTime()}`;

    const gp: GitProject = GitCommandGitProject.fromProject(p, BitBucketServerCredentials);

    const bbid = new BitBucketServerRepoRef(bitBucketRemoteBase, owningProject, repo);

    return gp.init()
        .then(() => gp.createAndSetRemote(
            bbid,
            "Thing1", TestRepositoryVisibility))
        .then(() => gp.commit("Added a README"))
        .then(() => gp.push())
        .then(() => GitCommandGitProject.cloned(BitBucketServerCredentials, bbid))
        .then(clonedp => {
            return testAndVerify(clonedp);
        })
        .then(() => bbid.deleteRemote(BitBucketServerCredentials),
            err => bbid.deleteRemote(BitBucketServerCredentials)
                .then(() => Promise.reject(new Error(err))));
}
