export type Commit = {
    hash: string;
    message: string;
    date: string;
    username: string;
}

export type CommitDiff = {
    globalStats: string;
    fileDiffs: string[];
}