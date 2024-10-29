// Regular expression to match non-ASCII characters
const nonAsciiPattern = /[^\x00-\x7F]/g;

export const getNonAsciiChars = (value: string) => {
    return value.match(nonAsciiPattern);
};
