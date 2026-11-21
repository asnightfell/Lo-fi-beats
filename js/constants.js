export const CHORDS = [
  { id: 'Fmaj9',  name: 'Fmaj9',  key: 'A', freqs: [174.61, 220.00, 261.63, 329.63, 392.00] },
  { id: 'Em7',    name: 'Em7',    key: 'S', freqs: [164.81, 196.00, 246.94, 293.66, 392.00] },
  { id: 'Dm9',    name: 'Dm9',    key: 'D', freqs: [146.83, 174.61, 220.00, 261.63, 329.63] },
  { id: 'Cmaj9',  name: 'Cmaj9',  key: 'F', freqs: [130.81, 164.81, 196.00, 246.94, 293.66] },
  { id: 'Am11',   name: 'Am11',   key: 'G', freqs: [110.00, 164.81, 196.00, 246.94, 293.66] },
  { id: 'G13sus', name: 'G13sus', key: 'H', freqs: [98.00,  174.61, 220.00, 261.63, 329.63] }
];

export const PROGRESSIONS = {
  midnight: [0, 1, 2, 3], // Fmaj9 -> Em7 -> Dm9 -> Cmaj9
  kyoto:    [2, 5, 3, 4], // Dm9 -> G13sus -> Cmaj9 -> Am11
  nostalgia:[0, 4, 2, 5]  // Fmaj9 -> Am11 -> Dm9 -> G13sus
};

export const TRACKS = [
  { id: 'kick',  name: 'DUSTY KICK' },
  { id: 'snare', name: 'TAPE SNARE' },
  { id: 'hat',   name: 'DARK HAT' },
  { id: 'perc',  name: 'WOOD RIM' }
];

export const DRUM_PRESETS = [
  {
    name: 'Rainy Midnight',
    patterns: {
      kick:  [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
      perc:  [0,0,0,1, 0,0,0,0, 0,0,1,0, 0,1,0,0]
    }
  },
  {
    name: 'J-Dilla Pocket',
    patterns: {
      kick:  [1,0,0,1, 0,0,0,1, 0,1,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,1,1,0, 1,0,1,1, 1,0,1,0, 1,1,1,0],
      perc:  [0,0,1,0, 0,1,0,0, 0,0,0,1, 0,0,1,0]
    }
  },
  {
    name: 'Lazy Sunday',
    patterns: {
      kick:  [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,1,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      perc:  [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,1]
    }
  }
];
