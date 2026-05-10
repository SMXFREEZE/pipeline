import { DeviceEventEmitter } from 'react-native';

export const resetEmitter = {
  emit: () => {
    DeviceEventEmitter.emit('resetAllChats');
  },
  addListener: (callback: () => void) => {
    return DeviceEventEmitter.addListener('resetAllChats', callback);
  },
};
