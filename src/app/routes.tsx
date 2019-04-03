import { h, Component } from 'preact';

import { Translate } from './components/translate/translate.component';
import { browser } from 'webextension-polyfill-ts';
import { goBack } from './data/page-config/actions';
import { ILayout } from './data/page-config/state';
import { IRoute } from './routes';
import { DeviceScreenSize, Platform } from './types';
import { mergeDeep } from './utils/merge-deep';
import { translate } from './utils/translate';
import { isExtension } from './utils/platform-utils';

export type IRouteConfig = ILayout;

interface IConfig {
    [platform: string]: {
        [screenSize: string]: IRouteConfig;
    };
}
export interface IRoute {
    name: string;
    path: string;
    getComponent: () => Promise<Component>;
    withoutWalletInstance?: boolean;
    config: IConfig;
}

const dashboardConfig: IRouteConfig = {
    topBar: {
        secondRow: {
            type: 'total-balance'
        },
        left: {
            icon: 'logo'
        },
        right: {
            type: 'menu',
            icon: 'more_vert',
            menuWidth: 200,
            items: [
                {
                    text: <Translate text="DashboardPage.menu.addNewAccount" />,
                    icon: 'add_circle_outline',
                    href: '/create-account'
                },
                {
                    text: <Translate text="DashboardPage.menu.openNewTab" />,
                    icon: 'launch',
                    action: () => {
                        browser.tabs.create({
                            url: document.location.href.replace('popup=1', '')
                        });
                    }
                },
                {
                    text: <Translate text="App.labels.settings" />,
                    icon: 'settings',
                    href: '/settings'
                }
            ]
        }
    }
};

const popupPageConfig = (titleTextKey): IConfig => {
    let text = <Translate text={titleTextKey} />;
    if (typeof titleTextKey === 'function') {
        text = titleTextKey;
    }

    return {
        [Platform.ALL]: {
            [DeviceScreenSize.ALL]: {
                topBar: {
                    options: {
                        theme: 'white'
                    },
                    left: {
                        icon: 'close',
                        action: goBack
                    },
                    middle: {
                        type: 'text',
                        text
                    }
                }
            }
        }
    };
};

export const ROUTES: IRoute[] = [
    {
        name: 'landingPage',
        path: '/',
        getComponent: () =>
            import('./pages/landing/landing.container').then(module => module.default),
        withoutWalletInstance: true,
        config: {
            [Platform.ALL]: {
                [DeviceScreenSize.ALL]: {
                    options: {
                        backgroundColor: 'primary'
                    },
                    topBar: {}
                }
            }
        }
    },
    {
        name: 'dashboard',
        path: '/dashboard',
        getComponent: () =>
            import('./pages/dashboard/dashboard.container').then(module => module.default),
        config: {
            [Platform.ALL]: {
                [DeviceScreenSize.ALL]: dashboardConfig
            }
        }
    },
    {
        name: 'createWallet',
        path: '/create-wallet',
        getComponent: () =>
            import('./pages/create-wallet/create-wallet.container').then(module => module.default),
        withoutWalletInstance: true,
        config: {
            [Platform.ALL]: {
                [DeviceScreenSize.ALL]: {
                    topBar: {
                        left: {
                            icon: 'close',
                            action: goBack
                        },
                        middle: {
                            type: 'text',
                            text: <Translate text="CreateWalletPage.title" />
                        }
                    }
                }
            }
        }
    },
    {
        name: 'importWallet',
        path: '/import-wallet',
        getComponent: () =>
            import('./pages/import-wallet/import-wallet.container').then(module => module.default),
        withoutWalletInstance: true,
        config: {
            [Platform.ALL]: {
                [DeviceScreenSize.ALL]: {
                    topBar: {
                        left: {
                            icon: 'close',
                            action: goBack
                        },
                        middle: {
                            type: 'text',
                            text: <Translate text="ImportWalletPage.title" />
                        }
                    }
                }
            }
        }
    },
    {
        name: 'send',
        path: '/send/:blockchain/:address',
        getComponent: () => import('./pages/send/send.container').then(module => module.default),
        config: popupPageConfig('App.labels.send')
    },
    {
        name: 'receive',
        path: '/receive/:blockchain/:address',
        getComponent: () =>
            import('./pages/receive/recieve.container').then(module => module.default),
        config: popupPageConfig('App.labels.receive')
    },
    {
        name: 'settingsDisclaimer',
        path: '/settings/disclaimer',
        getComponent: () =>
            import('./pages/settings/pages/disclaimer/disclaimer.component').then(
                module => module.DisclaimerPage as any
            ),
        config: popupPageConfig('DisclaimerPage.title')
    },
    {
        name: 'settingsCurrency',
        path: '/settings/currency',
        getComponent: () =>
            import('./pages/settings/pages/currency/currency.container').then(
                module => module.default
            ),
        config: popupPageConfig('CurrencyPage.title')
    },
    {
        name: 'settingsNetworkOptions',
        path: '/settings/networkOptions/:blockchain?',
        getComponent: () =>
            import('./pages/settings/pages/network-options/network-options.container').then(
                module => module.default
            ),
        config: popupPageConfig('NetworkOptionsPage.title')
    },
    {
        name: 'settings',
        path: '/settings/:level1?',
        getComponent: () =>
            import('./pages/settings/settings.container').then(module => module.default),
        config: {
            [Platform.ALL]: {
                [DeviceScreenSize.ALL]: {
                    topBar: {
                        left: {
                            icon: 'navigate_before',
                            action: goBack
                        },
                        middle: {
                            type: 'text',
                            text: () => {
                                const level1 =
                                    (isExtension() ? location.hash : location.pathname).split(
                                        '/'
                                    )[2] || '';

                                switch (level1) {
                                    case 'security':
                                        return <Translate text="SettingsPage.security" />;
                                    case 'developerOptions':
                                        return <Translate text="SettingsPage.developerOptions" />;
                                    default:
                                        return <Translate text="App.labels.settings" />;
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    {
        name: 'transactionDetails',
        path: '/transaction/:blockchain/:address/:transactionId',
        getComponent: () =>
            import('./pages/transaction-details/transaction-details.container').then(
                module => module.default
            ),
        config: popupPageConfig('TransactionDetailsPage.title')
    },
    {
        name: 'reveal',
        path: '/reveal/:type/:blockchain?/:address?',
        getComponent: () =>
            import('./pages/reveal/reveal.container').then(module => module.default),
        config: popupPageConfig(() =>
            translate(
                `RevealPage.${
                    (isExtension() ? location.hash : location.pathname).split('/')[2]
                }.title`
            )
        )
    },
    {
        name: 'create-account',
        path: '/create-account',
        getComponent: () =>
            import('./pages/create-account/create-account.component').then(
                module => module.CreateAccountPage
            ),
        config: popupPageConfig(() => translate(`CreateAccountPage.title`))
    },
    {
        name: 'transaction-confirmation',
        path: '/transaction-confirmation',
        getComponent: () =>
            import('./pages/transaction-confirmation/transaction-confirmation.container').then(
                module => module.default
            ),
        config: {}
    },
    {
        name: 'request-account-access',
        path: '/request-account-access',
        getComponent: () =>
            import('./pages/request-account-access/request-account-access.container').then(
                module => module.default
            ),
        config: {}
    },
    {
        name: 'account',
        path: '/account/:blockchain/:address',
        getComponent: () =>
            import('./pages/account/account.container').then(module => module.default),
        config: {
            [Platform.ALL]: {
                [DeviceScreenSize.SMALL]: {
                    topBar: {
                        left: {
                            icon: 'navigate_before',
                            action: goBack
                        },
                        middle: {
                            type: 'tokenPageTitle'
                        }
                    }
                },
                [DeviceScreenSize.BIG]: dashboardConfig
            }
        }
    }
];

export const getRouteConfig = (
    routeConfig: IRouteConfig,
    platform: Platform,
    screenSize: DeviceScreenSize
): IRouteConfig => {
    let result = {};

    if (routeConfig) {
        const paths = [
            [platform, screenSize],
            [platform, DeviceScreenSize.ALL],
            [Platform.ALL, screenSize],
            [Platform.ALL, DeviceScreenSize.ALL]
        ].reverse();

        const configs = [];
        for (const path of paths) {
            if (routeConfig[path[0]] && routeConfig[path[0]][path[1]]) {
                configs.push(routeConfig[path[0]][path[1]]);
            }
        }
        result = mergeDeep({}, ...configs);
    }

    return result;
};