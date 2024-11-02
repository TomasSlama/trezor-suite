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

    const isSingleChar = nonAsciiChars.length === 1;
    const messageId = isSingleChar ? 'TR_NON_ASCII_CHAR' : 'TR_NON_ASCII_CHARS';
    const chars = isSingleChar ? '"{char}"' : 'characters';
    const defaultMessage = `{label} (with non-recommended ${chars})`;

    return (
        <FormattedMessage
            id={messageId}
            defaultMessage={defaultMessage}
            values={{ char: nonAsciiChars[0], label }}
        />
    );
};
