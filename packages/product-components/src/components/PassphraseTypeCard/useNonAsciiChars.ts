import { useEffect, useState, useMemo } from 'react';
import { getNonAsciiChars } from '@trezor/utils';

export const useNonAsciiChars = (value: string) => {
    const [nonAsciiChars, setNonAsciiChars] = useState<string[] | null>(null);
    const [hasNonAsciiChars, setHasNonAsciiChars] = useState(false);
    const [showAsciiBanner, setShowAsciiBanner] = useState(false);

    useEffect(() => {
        const nonAsciiChars = getNonAsciiChars(value);
        const hasNonAsciiChars = Array.isArray(nonAsciiChars);

        setNonAsciiChars(nonAsciiChars);
        setHasNonAsciiChars(hasNonAsciiChars);

        if (hasNonAsciiChars) {
            // If the banner was displayed once, we don't hide it again
            setShowAsciiBanner(true);
        }
    }, [value]);

    return { nonAsciiChars, hasNonAsciiChars, showAsciiBanner };
};
