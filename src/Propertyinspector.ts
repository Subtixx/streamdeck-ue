import {FormBuilder} from '@rweich/streamdeck-formbuilder';
import {Streamdeck} from '@rweich/streamdeck-ts';

import {isSettings, Settings} from './Settings';

const pi = new Streamdeck().propertyinspector();
let builder: FormBuilder<Settings> | undefined;

pi.on('websocketOpen', ({uuid}) => pi.getSettings(uuid)); // trigger the didReceiveSettings event

pi.on('didReceiveSettings', ({settings}) => {
    if (builder === undefined) {
        const initialData: Settings = isSettings(settings) ? settings : {
            background: 'orange',
            host: 'localhost',
            port: '30010',
            payload: '',
            response: '',
            endpoint: '',
        };
        builder = new FormBuilder<Settings>(initialData);
        const numbers = builder.createDropdown().setLabel('Change Value');
        for (const [index] of Array.from({length: 10}).entries()) {
            numbers.addOption(String(index), String(index));
        }

        builder.addElement('host', builder.createInput().setLabel('Host'));
        builder.addElement('port', builder.createInput().setLabel('Port'));
        builder.addElement(
            'background',
            builder
                .createDropdown()
                .setLabel('Background')
                .addOption('Orange Background', 'orange')
                .addOption('Red Background', 'red')
                .addOption('Green Background', 'green')
                .addOption('Blue Background', 'blue'),
        );

        builder.addElement('response',
            builder
                .createInput()
                .setPlaceholder('ex: RelativeRotation.Pitch')
                .setLabel('Response')
        );

        builder.addElement('endpoint',
            builder
                .createInput()
                .setPlaceholder('ex: remote/object/call')
                .setLabel('Endpoint')
        );

        /*

    <div class="sdpi-item">
        <div class="sdpi-item-label">Port</div>
        <input class="sdpi-item-value"/></div>
         */
        let payloadRow = document.createElement('div');
        payloadRow.setAttribute('class', 'sdpi-item');
        let payloadLabel = document.createElement('div');
        payloadLabel.setAttribute('class', 'sdpi-item-label');
        payloadLabel.innerText = 'Payload';
        payloadRow.appendChild(payloadLabel);

        let payload = document.createElement('textarea');
        payload.name = 'payload';
        payload.placeholder = 'Enter payload here';
        payload.value = initialData.payload ?? '';
        payload.cols = 50;
        payload.rows = 10;
        payloadRow.appendChild(payload);

        builder.addHtmlElement(payloadRow);

        let connectionStatus = document.createElement('div');
        connectionStatus.innerText = '';

        let checkConnectionButton = document.createElement('button');
        checkConnectionButton.innerText = 'Check Connection';
        checkConnectionButton.onclick = () => {
            let host = builder?.getFormData()?.host;
            let port = builder?.getFormData()?.port;
            let url = 'http' + `://${host}:${port}/remote/info`;

            checkConnectionButton.disabled = true;
            fetch(url).then((response) => {
                if (response.ok) {
                    connectionStatus.setAttribute('style', 'color: green; display: inline');
                    connectionStatus.innerText = 'Connection successful!';
                } else {
                    connectionStatus.setAttribute('style', 'color: red; display: inline');
                    connectionStatus.innerText = 'Connection failed!';
                }
                checkConnectionButton.disabled = false;
            });
        };
        builder.addHtmlElement(checkConnectionButton);

        builder.addHtmlElement(connectionStatus);

        builder.appendTo(document.querySelector('.sdpi-wrapper') ?? document.body);
        builder.on('change-settings', () => {
            if (pi.pluginUUID === undefined) {
                console.error('pi has no uuid! is it registered already?', pi.pluginUUID);
                return;
            }
            let settingsToSave = builder?.getFormData();
            if (settingsToSave === undefined) {
                console.error('settingsToSave is undefined!');
                return;
            }
            settingsToSave.payload = payload.value;
            pi.setSettings(pi.pluginUUID, settingsToSave);
        });
    } else if (isSettings(settings)) {
        builder.setFormData(settings);
    }
});

export default pi;
