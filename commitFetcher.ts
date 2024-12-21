import { exec } from 'child_process';
import { promisify } from 'util';
import { Commit, CommitStatisticEntry } from './schemas';

export async function fetchCommits( { filters = {}, path = "." }: { filters?: Partial<Commit>, path?: string } = {}): Promise<Commit[]> {
    const execAsync = promisify(exec);

    try {
        // Format: hash, author name, date, and message
        const { stdout, stderr } = await execAsync(`cd "${path}" && git log --pretty=format:"%H|%an|%ad|%s" `);
        
        if (stderr) {
            throw new Error(`Git log error: ${stderr}`);
        }

        if (!stdout.trim()) {
            return [];
        }

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

export async function getCommitStatistics(commit: Commit, path: string = "."):Promise<CommitStatisticEntry[]> {
    const execAsync = promisify(exec);
    try {
        // Get just the stats summary using --shortstat
        const { stdout: globalStats, stderr } = await execAsync(`cd "${path}" && git show --stat ${commit.hash}`);
        
        if (stderr) {
            console.warn(`Warning in git show: ${stderr}`);
        }

        if (!globalStats || !globalStats.trim()) {
            return [];
        }

        const lines = globalStats.split('\n');
        if (lines.length < 8) { // Need at least header lines + 1 stat line
            return [];
        }

        // Ignore the commits details lines and the last line which consist of the summary
        const slicedGlobalStatsArray = lines.slice(6, -2);
        
        return slicedGlobalStatsArray
            .filter(line => line && line.trim()) // Filter out empty lines
            .map(line => {
                const segments = line.split(" ").filter(segment => segment.length > 0);
                if (segments.length < 4) {
                    return null;
                }
                
                const [fileName, , totalChangesStr, operationsGraph] = segments;
                const totalChanges = parseInt(totalChangesStr, 10);
                
                if (!operationsGraph || isNaN(totalChanges)) {
                    return null;
                }

                const plusSymbols = (operationsGraph.match(/\+/g) || []).length;
                const minusSymbols = (operationsGraph.match(/-/g) || []).length;
                const totalSymbols = plusSymbols + minusSymbols;

                if (totalSymbols === 0) {
                    return {
                        fileName,
                        totalChanges,
                        numberOfInsertions: 0,
                        numberOfDeletions: 0
                    };
                }

                return {
                    fileName,
                    totalChanges,
                    numberOfInsertions: Math.round((plusSymbols / totalSymbols) * totalChanges),
                    numberOfDeletions: Math.round((minusSymbols / totalSymbols) * totalChanges)
                };
            })
            .filter((entry): entry is CommitStatisticEntry => entry !== null);
    } catch (error) {
        console.error('Error fetching commit diff:', error instanceof Error ? error.message : 'Unknown error');
        return [];  // Return empty array instead of throwing to handle gracefully
    }
}

export async function fetchCommitsWithStatistics(
    params: { filters?: Partial<Commit>, path?: string } = {}
){

    const commits = await fetchCommits(params)
    const commitStatistics = await Promise.all(commits.map(commit => getCommitStatistics(commit, params.path)));
    return commits.map((commit,i) => {
        return {
            commit,
            statistics: commitStatistics[i]
        }
    })
}

export async function fetchDiffs({filePath, hash, path = "."}:{hash:Commit['hash'], filePath:string, path?: string}){
    const execAsync = promisify(exec)
    try{
        const { stdout, stderr } = await execAsync(`cd "${path}" && git diff ${hash} ${filePath}`)
        
        if (stderr) {
            throw new Error(`Git diff error: ${stderr}`);
        }

        return stdout
    }catch(err){
        console.error("Failed to fetch the diff:", err instanceof Error ? err.message : 'Unknown error');
        throw err;
    }
}