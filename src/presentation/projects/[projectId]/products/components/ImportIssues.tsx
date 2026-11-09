const ISSUES_SHOWN = 20;

interface ImportIssue {
    key: string;
    label: string;
    message: string;
}

export const ImportIssues = ({ issues }: { issues: ImportIssue[] }) => {
    if (issues.length === 0) return null;

    return (
        <ul className="grid max-h-48 gap-1 overflow-y-auto rounded-md border border-border p-2 text-[13px]">
            {issues.slice(0, ISSUES_SHOWN).map((issue) => (
                <li key={issue.key}>
                    <span className="text-muted-foreground">{issue.label}:</span> {issue.message}
                </li>
            ))}
            {issues.length > ISSUES_SHOWN && (
                <li className="text-muted-foreground">и ещё {issues.length - ISSUES_SHOWN}</li>
            )}
        </ul>
    );
};
