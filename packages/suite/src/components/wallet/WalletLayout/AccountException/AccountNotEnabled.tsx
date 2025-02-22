import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Network } from '@suite-common/wallet-config';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

interface AccountNotEnabledProps {
    network: Network;
}

/**
 * Handler for invalid router params, coin is not enabled in settings
 * see: @wallet-actions/selectedAccountActions
 */
export const AccountNotEnabled = ({ network }: AccountNotEnabledProps) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const handleClick = () => dispatch(changeCoinVisibility(network.symbol, true));

    return (
        <AccountExceptionLayout
            title={
                <Translation
                    id="TR_ACCOUNT_EXCEPTION_NOT_ENABLED"
                    values={{ networkName: network.name }}
                />
            }
            iconName="warning"
            iconVariant="warning"
            actions={[
                {
                    icon: 'plus',
                    key: '1',
                    isLoading: isLocked(),
                    onClick: handleClick,
                    children: (
                        <Translation
                            id="TR_ENABLE_NETWORK_BUTTON"
                            values={{ networkName: network.name }}
                        />
                    ),
                },
            ]}
        />
    );
};
