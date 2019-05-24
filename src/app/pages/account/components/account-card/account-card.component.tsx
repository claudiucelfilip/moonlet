import { h, Component } from 'preact';
import Card from 'preact-material-components/Card';
import { BLOCKCHAIN_INFO } from '../../../../../utils/blockchain/blockchain-info';

import './account-card.scss';
import Balance from '../../../../components/balance/balance.container';
import { GenericAccount } from 'moonlet-core/src/core/account';
import Typography from 'preact-material-components/Typography';
import { getAccountIcon } from '../../../../utils/account';

interface IProps {
    account: GenericAccount;
    showAddress?: boolean;
}

export class AccountCard extends Component<IProps> {
    public render() {
        const address = this.props.account.address || '';

        return (
            <Card className="account-card">
                <div class="account-card-inner">
                    <div class="blockchain-logo">
                        <img
                            src={`/assets/token-logos/${BLOCKCHAIN_INFO[
                                this.props.account.node.blockchain
                            ].coin.toLowerCase()}.svg`}
                        />
                    </div>
                    <div class="account-name">{this.props.account.name}</div>
                    <div class="account-type">
                        <img src={getAccountIcon(this.props.account)} />
                    </div>
                </div>

                {this.props.showAddress && (
                    <Typography headline6 class="center-text">
                        {address.substr(0, 7)}...{address.substr(-5)}
                    </Typography>
                )}

                <div class="account-balance">
                    <Balance
                        blockchain={this.props.account.node.blockchain}
                        address={this.props.account.address}
                    />
                </div>
                <div class="account-balance-fiat center-text">
                    ~{' '}
                    <Balance
                        blockchain={this.props.account.node.blockchain}
                        address={this.props.account.address}
                        convert
                    />
                </div>
            </Card>
        );
    }
}
