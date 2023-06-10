export default function toSentenceCase(string: string): string {
    const baseStr = string.replaceAll(/[^a-zA-Z]/g, '');
    return baseStr.slice(0, 1).toUpperCase() + baseStr.slice(1).toLowerCase();
}