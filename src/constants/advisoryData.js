// Crop advisory calendar — task schedule relative to sowing date (days).
// Each task: { id, titleKey, descKey, days, type, icon }
// type: 'sowing' | 'irrigation' | 'fertilizer' | 'spray' | 'labour' | 'harvest'

export const ADVISORY_CROPS = ['cotton', 'groundnut', 'wheat', 'bajra', 'castor', 'cumin'];

export const ADVISORY_CROP_ICONS = {
  cotton: '🌿', groundnut: '🥜', wheat: '🌾',
  bajra: '🌾', castor: '🌾', cumin: '🌱',
};

export const ADVISORY_SCHEDULE = {
  cotton: [
    { id: 'c1', days: 0,   type: 'sowing',     icon: '🌱', titleKey: 'taskSowing',      descKey: 'taskCottonSowing'    },
    { id: 'c2', days: 3,   type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation1', descKey: 'taskCottonIrr1'     },
    { id: 'c3', days: 15,  type: 'labour',      icon: '👨‍🌾', titleKey: 'taskThinning',    descKey: 'taskCottonThinning' },
    { id: 'c4', days: 21,  type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer1', descKey: 'taskCottonFert1'   },
    { id: 'c5', days: 25,  type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation2', descKey: 'taskCottonIrr2'   },
    { id: 'c6', days: 35,  type: 'spray',       icon: '🪣', titleKey: 'taskSpray1',      descKey: 'taskCottonSpray1' },
    { id: 'c7', days: 45,  type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer2', descKey: 'taskCottonFert2'  },
    { id: 'c8', days: 55,  type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation3', descKey: 'taskCottonIrr3'  },
    { id: 'c9', days: 65,  type: 'spray',       icon: '🪣', titleKey: 'taskSpray2',      descKey: 'taskCottonSpray2' },
    { id:'c10', days: 90,  type: 'spray',       icon: '🪣', titleKey: 'taskSpray3',      descKey: 'taskCottonSpray3' },
    { id:'c11', days: 120, type: 'harvest',     icon: '🎯', titleKey: 'taskHarvest',     descKey: 'taskCottonHarvest' },
    { id:'c12', days: 140, type: 'harvest',     icon: '🎯', titleKey: 'taskHarvest2',    descKey: 'taskCottonHarvest2' },
  ],
  groundnut: [
    { id: 'g1', days: 0,  type: 'sowing',     icon: '🌱', titleKey: 'taskSowing',      descKey: 'taskGndSowing'   },
    { id: 'g2', days: 4,  type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation1', descKey: 'taskGndIrr1'    },
    { id: 'g3', days: 20, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer1', descKey: 'taskGndFert1'  },
    { id: 'g4', days: 30, type: 'labour',      icon: '👨‍🌾', titleKey: 'taskWeeding',    descKey: 'taskGndWeeding' },
    { id: 'g5', days: 35, type: 'spray',       icon: '🪣', titleKey: 'taskSpray1',      descKey: 'taskGndSpray1' },
    { id: 'g6', days: 45, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer2', descKey: 'taskGndFert2'  },
    { id: 'g7', days: 60, type: 'spray',       icon: '🪣', titleKey: 'taskSpray2',      descKey: 'taskGndSpray2' },
    { id: 'g8', days: 90, type: 'harvest',     icon: '🎯', titleKey: 'taskHarvest',     descKey: 'taskGndHarvest' },
  ],
  wheat: [
    { id: 'w1', days: 0,  type: 'sowing',     icon: '🌱', titleKey: 'taskSowing',      descKey: 'taskWhtSowing'   },
    { id: 'w2', days: 2,  type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation1', descKey: 'taskWhtIrr1'    },
    { id: 'w3', days: 21, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer1', descKey: 'taskWhtFert1'   },
    { id: 'w4', days: 21, type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation2', descKey: 'taskWhtIrr2'   },
    { id: 'w5', days: 42, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer2', descKey: 'taskWhtFert2'  },
    { id: 'w6', days: 42, type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation3', descKey: 'taskWhtIrr3'  },
    { id: 'w7', days: 55, type: 'spray',       icon: '🪣', titleKey: 'taskSpray1',      descKey: 'taskWhtSpray1' },
    { id: 'w8', days: 63, type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation4', descKey: 'taskWhtIrr4'  },
    { id: 'w9', days:110, type: 'harvest',     icon: '🎯', titleKey: 'taskHarvest',     descKey: 'taskWhtHarvest' },
  ],
  bajra: [
    { id: 'b1', days: 0,  type: 'sowing',     icon: '🌱', titleKey: 'taskSowing',      descKey: 'taskBajraSowing'   },
    { id: 'b2', days: 5,  type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation1', descKey: 'taskBajraIrr1'    },
    { id: 'b3', days: 21, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer1', descKey: 'taskBajraFert1'   },
    { id: 'b4', days: 30, type: 'spray',       icon: '🪣', titleKey: 'taskSpray1',      descKey: 'taskBajraSpray1' },
    { id: 'b5', days: 55, type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation2', descKey: 'taskBajraIrr2'   },
    { id: 'b6', days: 70, type: 'harvest',     icon: '🎯', titleKey: 'taskHarvest',     descKey: 'taskBajraHarvest' },
  ],
  castor: [
    { id: 'r1', days: 0,  type: 'sowing',     icon: '🌱', titleKey: 'taskSowing',      descKey: 'taskCastorSowing'   },
    { id: 'r2', days: 5,  type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation1', descKey: 'taskCastorIrr1'    },
    { id: 'r3', days: 25, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer1', descKey: 'taskCastorFert1'   },
    { id: 'r4', days: 40, type: 'spray',       icon: '🪣', titleKey: 'taskSpray1',      descKey: 'taskCastorSpray1' },
    { id: 'r5', days: 60, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer2', descKey: 'taskCastorFert2'  },
    { id: 'r6', days: 90, type: 'harvest',     icon: '🎯', titleKey: 'taskHarvest',     descKey: 'taskCastorHarvest' },
  ],
  cumin: [
    { id: 'j1', days: 0,  type: 'sowing',     icon: '🌱', titleKey: 'taskSowing',      descKey: 'taskCuminSowing'   },
    { id: 'j2', days: 3,  type: 'irrigation',  icon: '💧', titleKey: 'taskIrrigation1', descKey: 'taskCuminIrr1'    },
    { id: 'j3', days: 20, type: 'fertilizer',  icon: '🧪', titleKey: 'taskFertilizer1', descKey: 'taskCuminFert1'   },
    { id: 'j4', days: 30, type: 'spray',       icon: '🪣', titleKey: 'taskSpray1',      descKey: 'taskCuminSpray1' },
    { id: 'j5', days: 50, type: 'spray',       icon: '🪣', titleKey: 'taskSpray2',      descKey: 'taskCuminSpray2' },
    { id: 'j6', days: 80, type: 'harvest',     icon: '🎯', titleKey: 'taskHarvest',     descKey: 'taskCuminHarvest' },
  ],
};

export const TASK_TYPE_COLORS = {
  sowing:     { bg: '#EEF2FF', text: '#4F46E5' },
  irrigation: { bg: '#EFF6FF', text: '#2563EB' },
  fertilizer: { bg: '#FEF3C7', text: '#D97706' },
  spray:      { bg: '#FEF2F2', text: '#DC2626' },
  labour:     { bg: '#F5F3FF', text: '#7C3AED' },
  harvest:    { bg: '#FFFBEB', text: '#B45309' },
};
