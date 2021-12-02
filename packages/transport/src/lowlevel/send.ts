// Logic of sending data to trezor
//
// Logic of "call" is broken to two parts - sending and receiving
import { Root } from 'protobufjs/light';
import { encode as encodeProtobuf } from './protobuf';
import { encode as encodeProtocol } from './protocol';
import { createMessageFromName } from './protobuf/messages';

// Sends more buffers to device.
async function sendBuffers(
    sender: (data: Buffer) => Promise<void>,
    buffers: Array<Buffer>,
): Promise<void> {
    for (const buffer of buffers) {
        await sender(buffer);
    }
}

// Sends message to device.
// Resolves if everything gets sent
export function buildOne(messages: Root, name: string, data: Object) {
    const { Message, messageType } = createMessageFromName(messages, name);

    const buffer = encodeProtobuf(Message, data);
    return encodeProtocol(buffer, {
        addTrezorHeaders: false,
        chunked: false,
        messageType,
    });
}

export const buildBuffers = (messages: Root, name: string, data: Object) => {
    const { Message, messageType } = createMessageFromName(messages, name);
    const buffer = encodeProtobuf(Message, data);
    return encodeProtocol(buffer, {
        addTrezorHeaders: true,
        chunked: true,
        messageType,
    });
};

// Sends message to device.
// Resolves if everything gets sent
export async function buildAndSend(
    messages: Root,
    sender: (data: Buffer) => Promise<void>,
    name: string,
    data: Object,
): Promise<void> {
    const buffers = buildBuffers(messages, name, data);
    return sendBuffers(sender, buffers);
}
