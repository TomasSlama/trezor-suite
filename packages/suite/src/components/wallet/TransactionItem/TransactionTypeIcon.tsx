import styled, { useTheme } from 'styled-components';
import { WalletAccountTransaction } from 'src/types/wallet';
import { IconLegacy, IconLegacyProps } from '@trezor/components';
import { getTxIcon } from '@suite-common/wallet-utils';

const IconsWrapper = styled.div<{ $isJoint: boolean }>`
    position: relative;
    width: 24px;
    transform: ${({ $isJoint }) => $isJoint && 'translate(2px, 0)'};
`;

const ClockIcon = styled(IconLegacy)`
    position: absolute;
    top: -2px;
    right: 0;
    background: ${({ theme }) => theme.legacy.BG_WHITE};
    border-radius: 50%;
`;

interface TransactionTypeIconProps extends Omit<IconLegacyProps, 'icon' | 'variant'> {
    type: WalletAccountTransaction['type'];
    isPending: boolean;
}

export const TransactionTypeIcon = ({ type, isPending, ...rest }: TransactionTypeIconProps) => {
    const theme = useTheme();

    const isJoint = type === 'joint';

    return (
        <IconsWrapper $isJoint={isJoint} {...rest}>
            <IconLegacy
                icon={getTxIcon(type)}
                color={type === 'failed' ? theme.legacy.TYPE_RED : theme.legacy.TYPE_LIGHT_GREY}
                size={isJoint ? 20 : 24}
                {...rest}
            />

            {isPending && (
                <ClockIcon icon="CLOCK_ACTIVE" size={12} color={theme.legacy.TYPE_ORANGE} />
            )}
        </IconsWrapper>
    );
};
