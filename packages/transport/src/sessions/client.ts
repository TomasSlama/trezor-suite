import { getWeakRandomId } from '@trezor/utils';
import { TypedEmitter } from '@trezor/utils';

import { Descriptor } from '../types';
import {
    EnumerateDoneRequest,
    AcquireIntentRequest,
    ReleaseIntentRequest,
    ReleaseDoneRequest,
    GetPathBySessionRequest,
    AcquireDoneRequest,
    RegisterBackgroundCallbacks,
} from './types';
import { SessionsBackground } from './background';

/**
 * SessionsClient gives you API for communication with SessionsBackground.
 * You should provide your own communication method in requestFn param (direct module access, sharedworker messages...)
 */
export class SessionsClient extends TypedEmitter<{
    descriptors: Descriptor[];
}> {
    // request method responsible for communication with sessions background.
    private request: SessionsBackground['handleMessage'];

    // used only for debugging - discriminating sessions clients in sessions background log
    private caller = getWeakRandomId(3);
    private id: number;

    constructor({
        requestFn,
        registerBackgroundCallbacks,
    }: {
        requestFn: SessionsBackground['handleMessage'];
        registerBackgroundCallbacks?: RegisterBackgroundCallbacks;
    }) {
        super();
        this.id = 0;
        this.request = params => {
            params.caller = this.caller;
            params.id = this.id;
            this.id++;

            return requestFn(params);
        };

        if (registerBackgroundCallbacks) {
            registerBackgroundCallbacks(descriptors => {
                this.emit('descriptors', descriptors);
            });
        }
    }

    public handshake() {
        return this.request({ type: 'handshake' });
    }
    public enumerateDone(payload: EnumerateDoneRequest) {
        return this.request({ type: 'enumerateDone', payload });
    }
    public acquireIntent(payload: AcquireIntentRequest) {
        return this.request({ type: 'acquireIntent', payload });
    }
    public acquireDone(payload: AcquireDoneRequest) {
        return this.request({ type: 'acquireDone', payload });
    }
    public releaseIntent(payload: ReleaseIntentRequest) {
        return this.request({ type: 'releaseIntent', payload });
    }
    public releaseDone(payload: ReleaseDoneRequest) {
        return this.request({ type: 'releaseDone', payload });
    }
    public getSessions() {
        return this.request({ type: 'getSessions' });
    }
    public getPathBySession(payload: GetPathBySessionRequest) {
        return this.request({ type: 'getPathBySession', payload });
    }
    public dispose() {
        this.removeAllListeners('descriptors');

        return this.request({ type: 'dispose' });
    }
}
