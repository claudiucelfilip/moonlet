import { AppRemoteConfigController } from './../../../plugins/app-remote-config/extension/app-remote-config-controller';
import { LedgerHwController } from './../../../plugins/ledger-hw/extension/ledger-hw-controller';
import { WalletController } from './../../../plugins/wallet/extension/wallet-controller';
import {
    BackgroundMessageController,
    IBackgroundMessage,
    BackgroundMessageType,
    ConnectionPort
} from '../types';
import { browser, Runtime } from 'webextension-polyfill-ts';

import { Response, IResponseData } from '../../../utils/response';

import { BrowserIconManager } from './browser-icon-manager';
import {
    initErrorReporting,
    setExtraDataOnErrorReporting
} from '../../../app/utils/platform-utils';
import { getEnvironment } from '../utils';
import * as uuid from 'uuid/v4';

const INSTALL_ID_KEY = 'installId';

// initialize Sentry
(async () => {
    const storage = await browser.storage.local.get();
    const env = await getEnvironment();
    let installId = storage[INSTALL_ID_KEY];
    if (!installId) {
        installId = uuid();
        browser.storage.local.set({
            [INSTALL_ID_KEY]: installId
        });
    }
    initErrorReporting(await browser.runtime.getManifest().version, env);
    setExtraDataOnErrorReporting(installId);
})();

// Implementation
// initialize controllers
const browserIconManager = new BrowserIconManager();
const ledgerController = new LedgerHwController();
const controllers = {
    [BackgroundMessageController.WALLET_CONTROLLER]: new WalletController(ledgerController),
    [BackgroundMessageController.LEDGER_HW_CONTROLLER]: ledgerController,
    [BackgroundMessageController.REMOTE_CONFIG]: new AppRemoteConfigController()
    // [BackgroundMessageController.REMOTE_INTERFACE]: remoteInterface
};

const generateResponse = (message: IBackgroundMessage, response: IResponseData) => {
    return { ...message, type: BackgroundMessageType.RESPONSE, response };
};

// setup message listeners
browser.runtime.onConnect.addListener((port: Runtime.Port) => {
    if (port.name === ConnectionPort.BACKGROUND) {
        const connectionId = Math.random()
            .toString()
            .substr(2);
        browserIconManager.openConnection(connectionId);

        let portDisconnected = false;
        port.onDisconnect.addListener(() => {
            portDisconnected = true;
            browserIconManager.closeConnection(connectionId);
        });
        // console.log('bg port connected');
        port.onMessage.addListener(async (message: IBackgroundMessage) => {
            // console.log('bg port', 'message', message);
            // TODO: extra check the message (sender.id)
            if (
                message.id &&
                message.type === BackgroundMessageType.REQUEST &&
                message.request &&
                controllers[message.request.controller] &&
                typeof controllers[message.request.controller][message.request.action] ===
                    'function'
            ) {
                try {
                    const response = await controllers[message.request.controller][
                        message.request.action
                    ](port.sender, ...(message.request.params || []));
                    if (!portDisconnected) {
                        port.postMessage(generateResponse(message, response));
                        // console.log('bg port', 'response', response);
                    }
                } catch (error) {
                    if (!portDisconnected) {
                        port.postMessage(
                            generateResponse(message, Response.reject('GENERIC_ERROR', error))
                        );
                    }
                }
            } else {
                port.postMessage(generateResponse(message, Response.reject('INVALID_REQUEST')));
            }
        });
    }
});

// set dev badge for non production environments
getEnvironment().then(env => {
    if (env === 'local') {
        browser.browserAction.setBadgeBackgroundColor({ color: 'orange' });
        browser.browserAction.setBadgeText({ text: 'L' });
    } else if (env === 'staging') {
        browser.browserAction.setBadgeBackgroundColor({ color: 'orange' });
        browser.browserAction.setBadgeText({ text: 'DEV' });
    }
});