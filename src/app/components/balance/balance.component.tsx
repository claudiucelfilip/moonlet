import { h, Component } from 'preact';
import { Blockchain } from 'moonlet-core/src/core/blockchain';
import { IAccountBalance, IAccountsBalances } from '../../data/wallet/state';
import Currency from '../currency/currency.container';
import { BLOCKCHAIN_INFO } from '../../utils/blockchain/blockchain-info';

interface IProps {
    blockchain: Blockchain;
    address: string;
    hideCurrency: boolean;
    convert: boolean;

    balances: IAccountsBalances;
    updateBalance: (blockchain: Blockchain, address: string) => any;
}

export class Balance extends Component<IProps> {
    constructor(props: IProps) {
        super(props);

        if (
            props.balances &&
            props.balances[props.blockchain] &&
            props.balances[props.blockchain][props.address] &&
            !props.balances[props.blockchain][props.address].loading
        ) {
            // balance available
        } else {
            props.updateBalance(props.blockchain, props.address);
        }
    }
    public render(props: IProps) {
        let balance: IAccountBalance = { loading: true, amount: undefined, lastUpdate: undefined };
        if (
            props.balances &&
            props.balances[props.blockchain] &&
            props.balances[props.blockchain][props.address]
        ) {
            balance = props.balances[props.blockchain][props.address];
        }

        return (
            <span>
                {balance.amount && (
                    <Currency
                        amount={parseFloat(balance.amount.toString())}
                        currency={BLOCKCHAIN_INFO[props.blockchain].coin}
                        hideCurrency={props.hideCurrency}
                        convert={props.convert}
                    />
                )}
                {!balance.amount && '...'}
            </span>
        );
    }
}
