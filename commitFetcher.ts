import { Commit, CommitDiff } from "./types/commit";
import { exec } from 'child_process';
import { promisify } from 'util';


export async function fetchCommits({ filters = {}, path = "." }: { filters?: Partial<Commit>, path?: string } = {}): Promise<Commit[]> {
    const execAsync = promisify(exec);

    try {
        // Format: hash, author name, date, and message
        const { stdout } = await execAsync(`cd ${path} & git log --pretty=format:"%H|%an|%ad|%s" `);

        const commits = stdout.split('\n').map(line => {
            const [hash, username, date, message] = line.split('|');
            return {
                hash,
                username,
                date,
                message
            };
        });



        return commits.filter((commit) => {
            const includesHash = filters.hash ? commit.hash.includes(filters.hash) : true;
            const includesUsername = filters.username ? commit.username === filters.username : true;
            const includesDate = filters.date ? commit.date.includes(filters.date) : true;
            const includesMessage = filters.message ? commit.message.includes(filters.message) : true;
            return includesHash && includesUsername && includesDate && includesMessage

        });
    } catch (error) {
        console.error('Error fetching git commits:', error);
        throw error;
    }
}

export async function getCommitDifs(commit: Commit): Promise<CommitDiff> {
    const execAsync = promisify(exec);
    try {
        // Get just the stats summary using --shortstat
        const { stdout: globalStats } = await execAsync(`git show --stat ${commit.hash}`);
        
        // Get just the diffs using --patch without stats
        const { stdout: diffOutput } = await execAsync(`git show --patch --format="" ${commit.hash}`);
        
        // Split the diff output into individual file diffs
        const fileDiffs = diffOutput.split('diff --git')
            .slice(1) // Remove the empty first element
            .map(section => 'diff --git' + section.trim())
            .filter(diff => diff.length > 0);
        
        return {
            // Extract just the last line which contains the stats
            globalStats: globalStats.split('\n').slice(6).join('\n') ,
            fileDiffs
        };
    } catch (error) {
        console.error('Error fetching commit diff:', error);
        throw error;
    }
}