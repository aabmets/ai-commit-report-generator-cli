import { exec } from "node:child_process";
import { promisify } from "node:util";
import { format } from "date-fns";
import type { Commit, CommitStatisticEntry } from "./schemas";
import type { DateRange } from "./types";

interface CommitFilters extends Partial<Commit> {
    dateRange?: DateRange;
    hashes?: Commit["hash"][];
}

interface FetchCommitsArgs {
    filters?: CommitFilters;
    path?: string;
}

export async function fetchCommits(args: FetchCommitsArgs = {}): Promise<Commit[]> {
    const { filters = {}, path = "." } = args;
    const execAsync = promisify(exec);
    try {
        let gitCommand: string;
        // Build git log command with date range if specified
        if (process.platform === "win32") {
            gitCommand = `cmd /C "cd /D ${path} && git log --format=%H^|%an^|%ad^|%s --date=short`;
        } else {
            gitCommand = `cd "${path}" && git log --format="%H|%an|%ad|%s" --date=short`;
        }

        if (filters.dateRange) {
            const afterDate = format(filters.dateRange.startDate, "yyyy-MM-dd");
            const beforeDate = format(filters.dateRange.endDate, "yyyy-MM-dd");
            gitCommand += ` --after="${afterDate}" --before="${beforeDate}"`;
        }

        if (process.platform === "win32") {
            gitCommand += `"`;
        }

        const { stdout, stderr } = await execAsync(gitCommand);

        if (stderr) {
            console.warn(`Git log warning: ${stderr}`);
        } else if (!stdout.trim()) {
            return [];
        }

        const trimmedCommits = stdout.split("\n").filter((line) => line.trim());
        const commits = trimmedCommits.map((line) => {
            const [hash, username, date, message] = line.split("|");
            return {
                hash,
                username,
                date,
                message,
            };
        });

        // Apply additional filters
        return commits.filter((commit) => {
            const inHashes = filters.hashes ? filters.hashes.includes(commit.hash) : true;
            const includesHash = filters.hash ? commit.hash.includes(filters.hash) : true;
            const includesUsername = filters.username ? commit.username === filters.username : true;
            const includesMessage = filters.message
                ? commit.message.includes(filters.message)
                : true;
            return inHashes && includesHash && includesUsername && includesMessage;
        });
    } catch (error) {
        console.error(
            "Error fetching git commits:",
            error instanceof Error ? error.message : "Unknown error",
        );
        return [];
    }
}

export async function getCommitStatistics(
    commit: Commit,
    path = ".",
): Promise<CommitStatisticEntry[]> {
    const execAsync = promisify(exec);
    try {
        // Get just the stats summary using --shortstat
        let showCommand: string;
        if (process.platform === "win32") {
            showCommand = `cmd /C "cd /D ${path} && git show --stat ${commit.hash}"`;
        } else {
            showCommand = `cd "${path}" && git show --stat ${commit.hash}`;
        }
        const { stdout: globalStats, stderr } = await execAsync(showCommand);

        if (stderr) {
            console.warn(`Warning in git show: ${stderr}`);
        }

        if (!globalStats.trim()) {
            return [];
        }

        const lines = globalStats.split("\n");
        if (lines.length < 8) {
            // Need at least header lines + 1 stat line
            return [];
        }

        // Ignore the commits details lines and the last line which consist of the summary
        const slicedGlobalStatsArray = lines.slice(6, -2);

        return slicedGlobalStatsArray
            .filter((line) => line?.trim()) // Filter out empty lines
            .map((line) => {
                const segments = line.split(" ").filter((segment) => segment.length > 0);
                if (segments.length < 4) {
                    return null;
                }

                const [fileName, , totalChangesStr, operationsGraph] = segments;
                const totalChanges = Number.parseInt(totalChangesStr, 10);

                if (!operationsGraph || Number.isNaN(totalChanges)) {
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
                        numberOfDeletions: 0,
                    };
                }

                return {
                    fileName,
                    totalChanges,
                    numberOfInsertions: Math.round((plusSymbols / totalSymbols) * totalChanges),
                    numberOfDeletions: Math.round((minusSymbols / totalSymbols) * totalChanges),
                };
            })
            .filter((entry): entry is CommitStatisticEntry => entry !== null);
    } catch (error) {
        console.error(
            "Error fetching commit diff:",
            error instanceof Error ? error.message : "Unknown error",
        );
        return []; // Return empty array instead of throwing to handle gracefully
    }
}

export async function fetchCommitsWithStatistics(
    params: { filters?: CommitFilters; path?: string } = {},
) {
    const commits = await fetchCommits(params);

    const commitStatistics = await Promise.all(
        commits.map((commit) => getCommitStatistics(commit, params.path)),
    );

    return commits.map((commit, i) => {
        return {
            commit,
            statistics: commitStatistics[i],
        };
    });
}

export async function fetchDiffs({
    filePath,
    hash,
    path = ".",
}: { hash: Commit["hash"]; filePath: string; path?: string }) {
    const execAsync = promisify(exec);
    try {
        let diffCommand: string;

        if (process.platform === "win32") {
            diffCommand = `cmd /C "cd /D ${path} && git diff ${hash} ${filePath}"`;
        } else {
            diffCommand = `cd "${path}" && git diff ${hash} ${filePath}`;
        }

        const { stdout, stderr } = await execAsync(diffCommand);

        if (stderr) {
            throw new Error(`Git diff error: ${stderr}`);
        }

        return stdout;
    } catch (err) {
        console.error(
            "Failed to fetch the diff:",
            err instanceof Error ? err.message : "Unknown error",
        );
        throw err;
    }
}

export async function getUniqueAuthors(path = "."): Promise<string[]> {
    const execAsync = promisify(exec);
    try {
        let authorsCommand: string;

        if (process.platform === "win32") {
            authorsCommand = `cmd /C "cd /D ${path} && git log --format=%an | sort /unique"`;
        } else {
            authorsCommand = `cd "${path}" && git log --format="%an" | sort -u`;
        }

        const { stdout, stderr } = await execAsync(authorsCommand);

        if (stderr) {
            console.warn(`Git log warning: ${stderr}`);
        }

        if (!stdout.trim()) {
            return [];
        }

        return stdout.trim().split("\n");
    } catch (error) {
        console.error(
            "Error fetching git authors:",
            error instanceof Error ? error.message : "Unknown error",
        );
        return [];
    }
}
