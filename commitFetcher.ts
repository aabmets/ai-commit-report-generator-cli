import { exec } from 'child_process';
import { promisify } from 'util';
import { Commit, CommitStatisticEntry } from './schemas';
import { format } from 'date-fns';
import { DateRange } from './types';

interface CommitFilters extends Partial<Commit> {
    dateRange?: DateRange;
}

export async function fetchCommits({ filters = {}, path = "." }: { filters?: CommitFilters, path?: string } = {}): Promise<Commit[]> {
    const execAsync = promisify(exec);

    try {
        // Build git log command with date range if specified
        let gitCommand = `cd "${path}" && git log --format="%H|%an|%ad|%s" --date=short`;

        if (filters.dateRange) {
            const afterDate = format(filters.dateRange.startDate, 'yyyy-MM-dd');
            const beforeDate = format(filters.dateRange.endDate, 'yyyy-MM-dd');
            gitCommand += ` --after="${afterDate}" --before="${beforeDate}"`;
        }

        const { stdout, stderr } = await execAsync(gitCommand);


        if (stderr) {
            console.warn(`Git log warning: ${stderr}`);
        }

        if (!stdout || !stdout.trim()) {
            return [];
        }

        const commits = stdout.split('\n').filter(line => line.trim()).map(line => {
            const [hash, username, date, message] = line.split('|');
            return {
                hash,
                username,
                date,
                message
            };
        });

        // Apply additional filters
        const filteredCommits = commits.filter((commit) => {
            const includesHash = filters.hash ? commit.hash.includes(filters.hash) : true;
            const includesUsername = filters.username ? commit.username === filters.username : true;
            const includesMessage = filters.message ? commit.message.includes(filters.message) : true;
            return includesHash && includesUsername && includesMessage;
        });

        return filteredCommits;
    } catch (error) {
        console.error('Error fetching git commits:', error instanceof Error ? error.message : 'Unknown error');
        return [];
    }
}

export async function getCommitStatistics(commit: Commit, path: string = "."): Promise<CommitStatisticEntry[]> {
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
    params: { filters?: CommitFilters, path?: string } = {}
) {

    const commits = await fetchCommits(params)

    const commitStatistics = await Promise.all(commits.map(commit => getCommitStatistics(commit, params.path)));

    return commits.map((commit, i) => {
        return {
            commit,
            statistics: commitStatistics[i]
        }
    })
}

export async function fetchDiffs({ filePath, hash, path = "." }: { hash: Commit['hash'], filePath: string, path?: string }) {
    const execAsync = promisify(exec)
    try {
        const { stdout, stderr } = await execAsync(`cd "${path}" && git diff ${hash} ${filePath}`)

        if (stderr) {
            throw new Error(`Git diff error: ${stderr}`);
        }

        return stdout
    } catch (err) {
        console.error("Failed to fetch the diff:", err instanceof Error ? err.message : 'Unknown error');
        throw err;
    }
}

export async function getUniqueAuthors(path: string = "."): Promise<string[]> {
    const execAsync = promisify(exec);
    try {
        const {stdout,stderr} = await execAsync(`cd "${path}" && git log --format="%an" | sort -u`);

        if (stderr) {
            console.warn(`Git log warning: ${stderr}`);
        }

        if (!stdout || !stdout.trim()) {
            return [];
        }

        return stdout.trim().split('\n');
    } catch (error) {
        console.error('Error fetching git authors:', error instanceof Error ? error.message : 'Unknown error');
        return [];
    }
}