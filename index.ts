import { fetchCommits, getCommitDifs } from "./commitFetcher";
import { Commit, CommitDiff } from "./types/commit";


async function main(){

const commits = await fetchCommits({})
const commitDifs = await getCommitDifs(commits[0]);
const commitsWithDifs:{commit:Commit,commitDif:CommitDiff}[] = [];
for(const commit of commits){
    console.log("fetching commit ",commit.hash)
    const commitDif = await getCommitDifs(commit);
    commitsWithDifs.push({commit,commitDif})
}


}
main()

