import BigNumber from 'bignumber.js';
import { createContext, useContext, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { fromWei } from 'web3-utils';
import { useSelector } from 'src/hooks/suite';
import { DEFAULT_PAYMENT, DEFAULT_OPRETURN, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { getExcludedUtxos, getFeeLevels } from '@suite-common/wallet-utils';
import { Account, WalletAccountTransaction } from 'src/types/wallet';
import { FormState, FeeInfo } from 'src/types/wallet/sendForm';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';
import { selectCurrentTargetAnonymity } from 'src/reducers/wallet/coinjoinReducer';
import { useBitcoinAmountUnit } from './useBitcoinAmountUnit';

export type UseRbfProps = {
    tx: WalletAccountTransaction;
    finalize: boolean;
    chainedTxs: WalletAccountTransaction[];
};

const getBitcoinFeeInfo = (info: FeeInfo, feeRate: string) => {
    // increase FeeLevels for visual purpose (old rate + defined rate)
    // it will be decreased in sendFormAction before composing
    const levels = getFeeLevels('bitcoin', info).map(l => ({
        ...l,
        feePerUnit: new BigNumber(l.feePerUnit).plus(feeRate).toString(),
    }));
    return {
        ...info,
        levels,
        minFee: new BigNumber(feeRate).plus(info.minFee).toNumber(), // increase required minFee rate
    };
};

const getEthereumFeeInfo = (info: FeeInfo, gasPrice: string) => {
    const current = new BigNumber(gasPrice);
    const minFeeFromNetwork = new BigNumber(
        fromWei(info.levels[0].feePerUnit, 'gwei'),
    ).integerValue(BigNumber.ROUND_FLOOR);

    const getMinFee = () => {
        if (minFeeFromNetwork.lte(current)) {
            return current.plus(1);
        }
        return minFeeFromNetwork;
    };

    const minFee = getMinFee();

    // increase FeeLevel only if it's lower than predefined
    const levels = getFeeLevels('ethereum', info).map(l => ({
        ...l,
        feePerUnit: minFee.toString(),
    }));
    return {
        ...info,
        levels,
        minFee: minFee.toNumber(), // increase required minFee rate
    };
};

const getFeeInfo = (
    networkType: Account['networkType'],
    info: FeeInfo,
    rbfParams: NonNullable<WalletAccountTransaction['rbfParams']>,
) => {
    if (networkType === 'bitcoin') return getBitcoinFeeInfo(info, rbfParams.feeRate);
    if (networkType === 'ethereum') return getEthereumFeeInfo(info, rbfParams.feeRate);
    return info;
};

const useRbfState = ({ tx, finalize, chainedTxs }: UseRbfProps, currentState: boolean) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const fees = useSelector(state => state.wallet.fees);
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);

    const { shouldSendInSats } = useBitcoinAmountUnit(tx.symbol);

    // do not calculate if currentState is already set (prevent re-renders)
    if (selectedAccount.status !== 'loaded' || !tx.rbfParams || currentState) return;

    const { account, network } = selectedAccount;
    const coinFees = fees[account.symbol];
    const feeInfo = getFeeInfo(account.networkType, coinFees, tx.rbfParams);
    // exclude utxo generated by this transaction. reduce output instead
    const otherUtxo = (account.utxo || []).filter(input => input.txid !== tx.rbfParams!.txid);

    // override Account data
    const rbfAccount = {
        ...account,
        utxo: tx.rbfParams.utxo.concat(otherUtxo),
        // make sure that the exact same change output will be picked by @trezor/connect > hd-wallet during the tx compose process
        // fallback to default if change address is not present
        addresses: account.addresses
            ? {
                  ...account.addresses,
                  change: tx.rbfParams.changeAddress
                      ? [tx.rbfParams.changeAddress]
                      : account.addresses.change,
              }
            : undefined,
    };

    // transform original outputs
    const outputs = tx.rbfParams.outputs.flatMap(o => {
        if (o.type === 'change') return [];
        if (o.type === 'opreturn') {
            return {
                ...DEFAULT_OPRETURN,
                dataHex: o.dataHex,
                dataAscii: o.dataAscii,
            };
        }
        return {
            ...DEFAULT_PAYMENT,
            address: o.address,
            amount: shouldSendInSats ? o.amount : o.formattedAmount,
            token: o.token,
        };
    });

    let { baseFee } = tx.rbfParams;
    if (chainedTxs.length > 0) {
        // increase baseFee, pay for all child chained transactions
        baseFee = chainedTxs.reduce((f, ctx) => f + parseInt(ctx.fee, 10), baseFee);
    }

    const rbfParams = {
        ...tx.rbfParams,
        baseFee,
    };

    const excludedUtxos = getExcludedUtxos({
        utxos: rbfAccount.utxo,
        dustLimit: coinFees.dustLimit,
        anonymitySet: rbfAccount.addresses?.anonymitySet,
        targetAnonymity,
    });

    return {
        account: rbfAccount,
        network,
        feeInfo,
        excludedUtxos,
        chainedTxs,
        formValues: {
            ...DEFAULT_VALUES,
            outputs,
            selectedFee: undefined,
            options: finalize ? ['broadcast'] : ['bitcoinRBF', 'broadcast'],
            ethereumDataHex: tx.rbfParams.ethereumData,
            rbfParams,
        } as FormState, // TODO: remove type casting (options string[])
    };
};

export const useRbf = (props: UseRbfProps) => {
    // local state
    const [state, setState] = useState<ReturnType<typeof useRbfState>>(undefined);

    // throttle state calculation
    const initState = useRbfState(props, !!state);
    useEffect(() => {
        if (!state && initState) {
            setState(initState);
        }
    }, [state, initState]);

    // react-hook-form
    const useFormMethods = useForm<FormState>({ mode: 'onChange' });
    const { reset, register, control, setValue, getValues, formState } = useFormMethods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register('setMaxOutputId');
        register('options');
    }, [register]);

    // react-hook-form reset, set default values
    useEffect(() => {
        reset(state?.formValues);
    }, [state, reset]);

    // sub-hook
    const { isLoading, composeRequest, composedLevels, onFeeLevelChange, signTransaction } =
        useCompose({
            ...useFormMethods,
            state,
            defaultField: 'selectedFee',
        });

    // sub-hook
    const { changeFeeLevel } = useFees({
        defaultValue: state?.formValues.selectedFee,
        feeInfo: state?.feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        composedLevels,
        ...useFormMethods,
    });

    // handle `finalize` change
    const { finalize } = props;
    useEffect(() => {
        const rbfEnabled = (getValues('options') || []).includes('bitcoinRBF');
        if (finalize === rbfEnabled) {
            setValue('options', finalize ? ['broadcast'] : ['broadcast', 'bitcoinRBF']);
            composeRequest();
        }
    }, [finalize, getValues, setValue, composeRequest]);

    // state can be undefined (no account, should never happen)
    // ts requires at least account field to be present (validated by context type)
    const ctxState = state ? { ...state } : { account: undefined };

    // If automatically composed transaction throws NOT-ENOUGH-FUNDS error
    useEffect(() => {
        if (ctxState.account?.networkType !== 'bitcoin' || !composedLevels) return;
        const { selectedFee, setMaxOutputId, outputs } = getValues();
        const tx = composedLevels[selectedFee || 'normal'];
        // sometimes tx is undefined (e.g. when fee level is changed during the initial compose)
        if (tx?.type === 'error' && tx.error === 'NOT-ENOUGH-FUNDS') {
            // try again with decreased output (use set-max calculation on the first possible output)
            if (typeof setMaxOutputId !== 'number') {
                setValue(
                    'setMaxOutputId',
                    outputs.findIndex(o => o.type === 'payment'),
                );
                composeRequest();
            } else {
                // set-max was already used and still no effect?
                // do not use set-max anymore and do not try compose again.
                setValue('setMaxOutputId', undefined);
            }
        }
    }, [ctxState.account, composedLevels, composeRequest, getValues, setValue]);

    return {
        ...ctxState,
        isLoading,
        register,
        control,
        formState,
        setValue,
        getValues,
        composedLevels,
        changeFeeLevel,
        composeRequest,
        signTransaction,
    };
};

// context accepts only valid state (non nullable account)
type RbfContextValues = ReturnType<typeof useRbf> & NonNullable<ReturnType<typeof useRbfState>>;

export const RbfContext = createContext<RbfContextValues | null>(null);
RbfContext.displayName = 'RbfContext';

// Used across rbf form components
// Provide combined context of `react-hook-form` with custom values as RbfContextValues
export const useRbfContext = () => {
    const ctx = useContext(RbfContext);
    if (ctx === null) throw Error('useRbfContext used without Context');
    return ctx;
};
