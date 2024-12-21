import { config as dotenvConfig } from 'dotenv';
import { fetchCommitsWithStatistics, getUniqueAuthors } from './commitFetcher';
import { CommitAIProcessorAgent } from './commitAIProcessorAgent';
import inquirer from 'inquirer';
import { addDays, subDays, subWeeks, format } from 'date-fns';
import { CommitSummary } from "./commitSummary";
import { JsonLocalCache } from "./json-local-cache";
import dotenv from 'dotenv'

dotenv.config();

type TimeUnit = 'days' | 'weeks';

interface DateRange {
    startDate: Date;
    endDate: Date;
}

interface UserOptions {
    dateRange: DateRange;
    username?: string;
}

async function promptForOptions(repoPath: string): Promise<UserOptions> {
    // First get the time unit and amount
    const { timeUnit } = await inquirer.prompt([
        {
            type: 'list',
            name: 'timeUnit',
            message: 'Do you want to specify the interval in days or weeks?',
            choices: ['days', 'weeks']
        }
    ]);

    const { amount } = await inquirer.prompt([
        {
            type: 'number',
            name: 'amount',
            message: `How many ${timeUnit} ago do you want to start from?`,
            validate: (value) => {
                if (value && value > 0) return true;
                return 'Please enter a number greater than 0';
            }
        }
    ]);

    const today = new Date();
    const startDate = timeUnit === 'weeks' ? subWeeks(today, amount) : subDays(today, amount);
    
    // Get list of authors and prompt for selection
    const authors = await getUniqueAuthors(repoPath);
    
    const { filterByAuthor } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'filterByAuthor',
            message: 'Do you want to filter commits by author?',
            default: false
        }
    ]);

    let username: string | undefined;
    
    if (filterByAuthor && authors.length > 0) {
        const { selectedAuthor } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedAuthor',
                message: 'Select an author:',
                choices: ['All Authors', ...authors],
            }
        ]);
        
        if (selectedAuthor !== 'All Authors') {
            username = selectedAuthor;
        }
    }

    return {
        dateRange: {
            startDate,
            endDate: today
        },
        username
    };
}

async function main() {
    const repoPath = "../../../bareedbox/NewBareedBox";
    const options = await promptForOptions(repoPath);
    
    console.log(`Fetching commits from ${format(options.dateRange.startDate, 'yyyy-MM-dd')} to ${format(options.dateRange.endDate, 'yyyy-MM-dd')}`);
    if (options.username) {
        console.log(`Filtering for author: ${options.username}`);
    }
    
    const commitsEntries = await fetchCommitsWithStatistics({
        path: repoPath,
        filters: {
            dateRange: options.dateRange,
            username: options.username
        }
    });

    console.log(`Found ${commitsEntries.length} commits in the specified date range`);
    
    const commitAIProcessorAgent = new CommitAIProcessorAgent();
    await commitAIProcessorAgent.init();
    
    let i = 0;
    for (const commit of commitsEntries.slice(0, 10)) {
        console.log(`Summarizing commit ${++i} of ${commitsEntries.length}`);
        const summary = await commitAIProcessorAgent.generateCommitSummary(commit);
        console.log(summary);
    }
}

main().catch(console.error);
