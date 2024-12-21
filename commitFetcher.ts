import { exec } from 'child_process';
import { promisify } from 'util';
import { Commit, CommitStatisticEntry } from './schemas';

export async function fetchCommits( { filters = {}, path = "." }: { filters?: Partial<Commit>, path?: string } = {}): Promise<Commit[]> {
    const execAsync = promisify(exec);

    try {
        // Format: hash, author name, date, and message
        const childProcess = await execAsync(`cd ${path} & git log --pretty=format:"%H|%an|%ad|%s" `);
        const { stdout } = childProcess;

        const commits = stdout.split('\n').map(line => {


            const [hash, username, date, message] = line.split('|');
            return {
                hash,
                username,
                date,
                message
            };
        });



        const filteredCommits = commits.filter((commit) => {
            const includesHash = filters.hash ? commit.hash.includes(filters.hash) : true;
            const includesUsername = filters.username ? commit.username === filters.username : true;
            const includesDate = filters.date ? commit.date.includes(filters.date) : true;
            const includesMessage = filters.message ? commit.message.includes(filters.message) : true;
            return includesHash && includesUsername && includesDate && includesMessage

        });

    
        return filteredCommits;
    } catch (error) {
        console.error('Error fetching git commits:', error);
        throw error;
    }
}

 export async function getCommitStatistics(commit: Commit):Promise<CommitStatisticEntry[]> {
    const execAsync = promisify(exec);
    try {
        // Get just the stats summary using --shortstat
        const { stdout: globalStats } = await execAsync(`git show --stat ${commit.hash}`);
        // Ignore the commits details lines and the last line which consist of the summary of the number of file changes, insertions and delections
        const slicedGlobalStatsArray = globalStats.split('\n').slice(6, -2)
            ;
         return (
            slicedGlobalStatsArray
                .map(
                    (line) => {
                        const [fileName, , totalChanges, operationsGraph] = line.split(" ")
                            .filter(segment => segment.length > 0);
                        const plusSymbols = operationsGraph.split("").filter(i => i === "+").length;
                        const minusSymbols = operationsGraph.split("").filter(i => i === "-").length;
                        return {
                            fileName,
                            totalChanges: +totalChanges,
                            numberOfInsertions: Math.round((plusSymbols / (plusSymbols + minusSymbols))*+totalChanges),
                            numberOfDeletions: Math.round((minusSymbols / (plusSymbols + minusSymbols))*+totalChanges),
                        }

                    }
                )
        )

    } catch (error) {
        console.error('Error fetching commit diff:', error);
        throw error;
    }
}

export async function fetchCommitsWithStatistics(
 params: { filters?: Partial<Commit>, path?: string } = {}
){

    const commits = await fetchCommits(params)
    const commitStatistics = await Promise.all(commits.map(getCommitStatistics) );
    return commits.map((commit,i) => {
        return {
            commit,
            statistics: commitStatistics[i]
        }
    })
}

export async function fetchDiffs({filePath,hash}:{hash:Commit['hash'],filePath:string}){
    const execAsync = promisify(exec)
    try{
        const {stdout} = await execAsync(`git diff ${hash} ${filePath}`)
        return stdout
    }catch(err){
        console.error("Failed to fetch the diff",err)

    }

}