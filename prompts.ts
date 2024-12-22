import inquirer from 'inquirer';
import { subDays, subWeeks } from 'date-fns';
import { TimeUnit, UserOptions } from './types';
import { getUniqueAuthors } from './commitFetcher';

export async function promptForScanFilteringOptions(repoPath: string): Promise<UserOptions> {
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
