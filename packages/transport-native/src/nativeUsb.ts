import { WebUSB } from '@trezor/react-native-usb';
import { Transport as AbstractTransport, AbstractApiTransport, UsbApi } from '@trezor/transport';

export class NativeUsbTransport extends AbstractApiTransport {
    // TODO: Not sure how to solve this type correctly.
    public name = 'NativeUsbTransport' as any;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger, ...rest } = params;

        super({
            api: new UsbApi({
                usbInterface: new WebUSB(),
                logger,
            }),
            ...rest,
        });
    }

    public listen() {
        this.api.listen();

        return super.listen();
    }
}
