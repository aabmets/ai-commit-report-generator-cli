import cliProgress from "cli-progress";

export interface ProgressBar {
    start(total: number): void;
    increment(): void;
    stop(): void;
}

class CliProgressBar implements ProgressBar {
    private bar: cliProgress.SingleBar;

    constructor(description: string) {
        this.bar = new cliProgress.SingleBar({
            format: `${description} [{bar}] {percentage}% | {value}/{total}`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            clearOnComplete: true,
        });
    }

    start(total: number): void {
        this.bar.start(total, 0);
    }

    increment(): void {
        this.bar.increment();
    }

    stop(): void {
        this.bar.stop();
    }
}

class NoOpProgressBar implements ProgressBar {
    start(): void {}
    increment(): void {}
    stop(): void {}
}

export class ProgressService {
    static createProgressBar(description: string, enabled = true): ProgressBar {
        return enabled ? new CliProgressBar(description) : new NoOpProgressBar();
    }
}
