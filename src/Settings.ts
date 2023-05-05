import {isSomething} from 'ts-type-guards';

export function isSettings(value: unknown): value is Settings {
    return (
        (value as Settings).hasOwnProperty('background')
        && isSomething((value as Settings).background)
        && (value as Settings).hasOwnProperty('host')
        && isSomething((value as Settings).host)
        && (value as Settings).hasOwnProperty('port')
        && isSomething((value as Settings).port)
        && (value as Settings).hasOwnProperty('payload')
        && isSomething((value as Settings).payload)
        && (value as Settings).hasOwnProperty('response')
        && isSomething((value as Settings).response)
        && (value as Settings).hasOwnProperty('endpoint')
        && isSomething((value as Settings).endpoint)
    );
}

export type Settings = {
    background: string;
    host: string;
    port: string;
    payload: string;
    response: string;
    endpoint: string;
};
