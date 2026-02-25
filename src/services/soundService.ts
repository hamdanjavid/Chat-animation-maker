let audioContext: AudioContext | null = null;
let mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;

export function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    mediaStreamDestination = audioContext.createMediaStreamDestination();
  }
  return { audioContext, mediaStreamDestination };
}

export function getAudioStream() {
  const { mediaStreamDestination } = getAudioContext();
  return mediaStreamDestination?.stream || null;
}

export async function playSound(url: string, volume = 0.5) {
  const { audioContext, mediaStreamDestination } = getAudioContext();
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (mediaStreamDestination) {
      gainNode.connect(mediaStreamDestination);
    }
    
    source.start(0);
  } catch (error) {
    console.warn("Failed to play sound:", error);
  }
}
