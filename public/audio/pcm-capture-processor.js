class ZikraPcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      this.port.postMessage(channel.slice());
    }
    return true;
  }
}

registerProcessor("zikra-pcm-capture", ZikraPcmCaptureProcessor);
