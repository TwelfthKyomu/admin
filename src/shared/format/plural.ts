const RU_PLURAL_RULES = new Intl.PluralRules('ru-RU');

export function pluralRu(
    count: number,
    forms: [one: string, few: string, many: string],
): string {
    switch (RU_PLURAL_RULES.select(count)) {
        case 'one':
            return forms[0];
        case 'few':
            return forms[1];
        default:
            return forms[2];
    }
}
