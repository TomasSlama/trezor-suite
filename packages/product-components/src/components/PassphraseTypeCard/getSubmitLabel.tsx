import type { ReactNode } from 'react';
import React from 'react';
import { FormattedMessage } from 'react-intl';

export const getSubmitLabel = ({
    nonAsciiChars,
    label,
}: {
    nonAsciiChars: null | string[];
    label: ReactNode;
}) => {
    if (!nonAsciiChars) return label;

    if (nonAsciiChars.length === 1) {
        return (
            <>
                {label}{' '}
                <FormattedMessage
                    id="TR_NON_ASCII_CHAR"
                    defaultMessage='(with non-recommended "{char}")'
                    values={{ char: nonAsciiChars[0] }}
                />
            </>
        );
    }

    return (
        <>
            {label}{' '}
            <FormattedMessage
                id="TR_NON_ASCII_CHARS"
                defaultMessage="(with non-recommended characters)"
            />
        </>
    );
};
