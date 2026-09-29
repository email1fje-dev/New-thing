const jobs = {
  developer: {
    name: "Developer",
    emoji: "💻",
    description: "Solve a small debugging challenge to earn money and Job XP.",
    reward: [180, 420],
    xp: 20
  },
  chef: {
    name: "Chef",
    emoji: "👨‍🍳",
    description: "Prepare the order in the correct sequence.",
    reward: [160, 380],
    xp: 18
  },
  driver: {
    name: "Driver",
    emoji: "🚕",
    description: "Complete a route challenge before time runs out.",
    reward: [190, 450],
    xp: 22
  },
  detective: {
    name: "Detective",
    emoji: "🕵️",
    description: "Pick the correct clue to progress through a case.",
    reward: [220, 500],
    xp: 25
  },
  mechanic: {
    name: "Mechanic",
    emoji: "🔧",
    description: "Identify the broken component in a quick repair challenge.",
    reward: [170, 410],
    xp: 20
  }
};

module.exports = { jobs };
