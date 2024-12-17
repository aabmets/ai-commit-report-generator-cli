import { CommitSummary } from "./commitSummary"
import { Commit } from "./types/commit"

export class ReportGenerator{

    private groupByDate(data:{
        commit:Commit,
        summary:CommitSummary
    }[]){


        return data.reduce((acc, d) => {
            const date = d.commit.date
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(d);
            return acc;
          }, {} as Record<string, typeof data>);
    }
    public generateReport(data:{
        commit:Commit,
        summary:CommitSummary
    }[]){

        const groupedByDate = this.groupByDate(data)
        return `
            # Weekly Report\n
            ${Object.keys(groupedByDate).map(date => `
                ## Commits of ${date}\n
                ${groupedByDate[date].map(d=>
                `
                #### Commit ${d.commit.hash}\n
                **Message**:\n
                ${d.commit.message}\n

                **Features**\n
                ${d.summary.features.map(f=>
                    `
                    - ${f}
                    `).join('\n')}
                `
                )}


            `).join('\n')}
        `
    }

}