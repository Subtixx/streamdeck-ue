import {Streamdeck} from '@rweich/streamdeck-ts';

import {isSettings} from './Settings';

const plugin = new Streamdeck().plugin();

/*
 * We only got one plugin instance, but there could be multiple actions.
 * So we need to keep track of the state of all actions based on their context.
 */

const numberCache: Record<string, number> = {};
const stepCache: Record<string, number> = {};
const backgroundCache: Record<string, string> = {};

/*
 * Helper functions
 */

const getNumber = (context: string): number => numberCache[context] || 0;
const getStep = (context: string): number => stepCache[context] || 1;

function changeNumber(number: number, context: string): void {
    number = number % 10;
    if (number < 0) {
        number += 10;
    }
    numberCache[context] = number;
    plugin.setTitle(String(number), context);
    plugin.setFeedback({indicator: {value: number * 11}, value: String(number)}, context);
}

function changeStep(step: number, context: string): void {
    stepCache[context] = ((step - 1) % 3) + 1;
    plugin.setFeedback({title: `Step: ${stepCache[context]}`}, context);
}

function changeBackground(background: string, context: string): void {
    const backgroundMap: Record<string, string> = {
        blue: 'images/action1.key.blue.png',
        green: 'images/action1.key.green.png',
        orange: 'images/action1.key.orange.png',
        red: 'images/action1.key.red.png',
    };
    if (backgroundCache[context] === background || backgroundMap[background] === undefined) {
        return;
    }

    const image = new Image();
    image.addEventListener('load', () => {
        const canvas = document.createElement('canvas');

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        canvas.getContext('2d')?.drawImage(image, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        plugin.setImage(dataURL, context);
        plugin.setFeedback({icon: {value: dataURL}}, context);
    });
    image.src = backgroundMap[background];

    backgroundCache[context] = background;
}

function saveSettings(context: string): void {
    plugin.setSettings(context, {
        background: backgroundCache[context] || 'orange',
        number: String(getNumber(context)),
        step: String(getStep(context)),
    });
}

/*
 * Bind listeners to all plugin events we want to be notified of
 *
 * 1st plugin lifecycle events ...
 */

// the first event we care about / that starts everything
plugin.on('willAppear', ({context}) => {
    // request saved state
    plugin.getSettings(context);
    // display the initial state of the action (the initial background state comes from the manifest)
    changeNumber(getNumber(context), context);
    changeStep(getStep(context), context);
});

let apiUrl = '';
let payload = '';
let responseKeySetting = '';
let endpoint = '';

// gets called after our getSettings request and whenever there are changes by the property inspector
plugin.on('didReceiveSettings', ({context, settings}) => {
    if (isSettings(settings)) {
        // noinspection HttpUrlsUsage
        apiUrl = `http://${settings.host}:${settings.port}`;
        payload = settings.payload;
        responseKeySetting = settings.response;
        endpoint = settings.endpoint;
        changeBackground(settings.background, context);
    }

    console.log(settings);
});

// reset our caches when an action gets removed
plugin.on('willDisappear', ({context}) => {
    delete numberCache[context];
    delete stepCache[context];
    delete backgroundCache[context];
});

/*
 * events for user interaction ...
 */

// increase the number on button press
plugin.on('keyDown', ({context}) => {
    if(apiUrl === '' || payload === ''){
        alert('Please configure the plugin first');
        return;
    }
    //changeNumber(getNumber(context) + 1, context);

    // fetch(url).then((response) => {
    // Get url from settings
    fetch(`${apiUrl}/${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: payload,
    }).then(async (response) => {
        let json = await response.json();
        if (!response.ok) {
            throw new Error(json.errorMessage);
        }
        // Read the response as json.
        console.log(json);
        if(responseKeySetting !== '') {
            // Split by dots
            let responseKeySettingArray = responseKeySetting.split('.');
            // Loop through the array
            for (let i = 0; i < responseKeySettingArray.length; i++) {
                // Get the key
                let key = responseKeySettingArray[i];
                if (key === '') {
                    continue;
                }

                if (json[key] === undefined) {
                    break;
                }
                // Get the value
                json = json[key];
            }

            if (json === undefined) {
                throw new Error('Response key not found');
            }

            if (typeof json !== 'string') {
                json = json.toString();
            }
            console.log(json);
            plugin.setTitle(json, context);
        }
    }).catch((error) => {
        console.error(error);
        alert(error);
    });

    //saveSettings(context);
});
// change the step value on touch
plugin.on('touchTap', ({context}) => {
    changeStep(getStep(context) + 1, context);
    saveSettings(context);
});
// reset the number on dial-press
plugin.on('dialPress', ({context}) => {
    changeNumber(0, context);
    saveSettings(context);
});
// increase or decrease the value on dial-rotate
plugin.on('dialRotate', ({context, ticks}) => {
    changeNumber(getNumber(context) + ticks * stepCache[context], context);
    saveSettings(context);
});

export default plugin;
