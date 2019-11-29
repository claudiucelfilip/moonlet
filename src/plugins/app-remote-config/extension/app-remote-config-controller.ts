import { Deferred } from './../../../utils/deferred';
import { IAppRemoteConfigPlugin } from '../iapp-remote-config-plugin';
import { Response } from '../../../utils/response';

const EXCHANGE_RATES_INTERVAL = 15 * 60 * 1000; // 15 minutes
const FEATURES_CONFIG_INTERVAL = 15 * 60 * 1000; // 15 minutes

const API_BASE_URL = 'https://api.moonlet.xyz';
const BINANCE_API_URL = 'https://api.binance.com/api/v1/exchangeInfo';

export class AppRemoteConfigController implements IAppRemoteConfigPlugin {
    private exchangeRates = {
        lastFetch: 0,
        data: undefined,
        inProgress: false,
        deferred: undefined
    };

    private featuresConfig = {
        lastFetch: 0,
        data: undefined,
        inProgress: false,
        deferred: undefined
    };

    constructor() {
        // warmup...
        this.getExchangeRates();
        this.getFeaturesConfig();
    }

    public async getExchangeRates() {
        // TODO replace when API_BASE_URL returns PERL echange rates
        const [res1, res2] = await Promise.all([
            this.fetchApi(
                `${API_BASE_URL}/exchangeRates`,
                this.exchangeRates,
                EXCHANGE_RATES_INTERVAL
            ),
            this.fetchApi(BINANCE_API_URL, {}, EXCHANGE_RATES_INTERVAL)
        ]);

        const PERLUSDC = res2.data.symbols
            .find(item => item.symbol === 'PERLUSDC')
            .filters.find(item => item.filterType === 'PERCENT_PRICE').multiplierUp;

        return {
            ...res1,
            data: {
                ...res1.data,
                PERL: {
                    USD: parseFloat(PERLUSDC)
                }
            }
        };
    }

    public async getFeaturesConfig() {
        return this.fetchApi(
            `${API_BASE_URL}/getFeaturesConfig`,
            this.featuresConfig,
            FEATURES_CONFIG_INTERVAL
        );
    }

    private async fetchApi(url, persistence, fetchInterval) {
        if (persistence.inProgress) {
            return persistence.deferred.promise;
        }

        if (persistence.lastFetch + fetchInterval > Date.now()) {
            return persistence.data;
        }

        try {
            persistence.inProgress = true;
            persistence.deferred = new Deferred();
            const data = await this.fetchWithRetry(url, 3);
            persistence.deferred.resolve(data);

            persistence.lastFetch = Date.now();
            persistence.data = data;
            persistence.inProgress = false;
            persistence.deferred = undefined;

            return data;
        } catch (e) {
            persistence.inProgress = false;

            if (persistence.data) {
                persistence.deferred.resolve(persistence.data);
                return persistence.data;
            }

            const error = Response.reject('GENERIC_ERROR', e.message);
            persistence.deferred.reject(error);
            return error;
        }
    }

    private async delay(ms) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), ms);
        });
    }

    private async fetchWithRetry(url: string, retries = 3) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return Response.resolve(data);
        } catch (e) {
            if (retries > 0) {
                await this.delay(Math.random() * (700 - 100) + 100); // random delay in rage 100-700 ms
                return this.fetchWithRetry(url, retries - 1);
            }
            throw e;
        }
    }
}
