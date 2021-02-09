export function getStringFromQueryString(name: string, defaultValue: string = ''): string {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(window.location.href);
    if (!results) return defaultValue;
    if (!results[2]) return defaultValue;

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function getNumberFromQueryString(name: string, defaultValue: number): number {
    return parseFloat(getStringFromQueryString(name, defaultValue.toString()));
}

export function getBooleanFromQueryString(name: string, defaultValue: string): boolean {
    return getStringFromQueryString(name, defaultValue.toString()) === 'true';
}