import { useEffect, useState, useMemo } from 'react';
import { getNonAsciiChars } from '@trezor/utils';

export const useNonAsciiChars = (value: string) => {
    const [showAsciiBanner, setShowAsciiBanner] = useState(false);

    const nonAsciiChars = useMemo(() => getNonAsciiChars(value), [value]);

    console.log({ value, nonAsciiChars });

    useEffect(() => {
        if (nonAsciiChars) {
            // If the banner was displayed once, we don't hide it again
            setShowAsciiBanner(true);
        }
    }, [nonAsciiChars]);

    return { nonAsciiChars, hasNonAsciiChars, showAsciiBanner };
};
