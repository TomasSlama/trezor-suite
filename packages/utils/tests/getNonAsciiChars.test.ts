import { getNonAsciiChars } from '../src/getNonAsciiChars';

describe('getNonAsciiChars', () => {
    test('should return null for an empty string', () => {
        expect(getNonAsciiChars('')).toBeNull();
    });

    test('should return null for ASCII-only characters', () => {
        expect(getNonAsciiChars('Hello, World!')).toBeNull();
    });

    test('should return all non-ASCII characters for a mixed string', () => {
        expect(getNonAsciiChars('Čau světe!')).toEqual(['Č', 'ě']);
    });

    test('should return all instances of repeating non-ASCII characters', () => {
        expect(getNonAsciiChars('Přátelé přátelé')).toEqual(['ř', 'á', 'é', 'ř', 'á', 'é']);
    });
});
