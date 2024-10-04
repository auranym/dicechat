import './main.css';
import '@fontsource-variable/quicksand';
import { RoomHost, RoomClient } from './src/lib';

const roomCode = 'AAAAAA';
let peer;

document.querySelector('#host').onclick = () => {
  if (peer) {
    console.warn('Peer already created.');
    return;
  }
  peer = new RoomHost(roomCode);
};
document.querySelector('#hostmessage').onclick = () => {
  if (!peer) {
    console.warn('Peer not yet created.');
    return;
  }
  if (!peer instanceof RoomHost) {
    console.warn('Peer is not a host');
    return;
  }
  peer.send('hello from host!');
}

document.querySelector('#close').onclick = () => {
  if (!peer) {
    console.warn('Peer not yet created.');
    return;
  }
  if (!peer instanceof RoomHost) {
    console.warn('Peer is not a host');
    return;
  }
  peer.close();
  peer = undefined;
};

document.querySelector('#client').onclick = () => {
  if (peer) {
    console.warn('Peer already created.');
    return;
  }
  peer = new RoomClient(roomCode);
};
document.querySelector('#clientmessage').onclick = () => {
  if (!peer) {
    console.warn('Peer not yet created.');
    return;
  }
  if (!peer instanceof RoomClient) {
    console.warn('Peer is not a host');
    return;
  }
  peer.send('hello from client!');
}
document.querySelector('#leave').onclick = () => {
  if (!peer) {
    console.warn('Peer not yet created.');
    return;
  }
  if (!peer instanceof RoomClient) {
    console.warn('Peer is not a host');
    return;
  }
  peer.leave();
  peer = undefined;
}