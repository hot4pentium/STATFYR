export const SPORT_POSITIONS: Record<string, string[]> = {
  Baseball: ["Pitcher", "Catcher", "First Base", "Second Base", "Shortstop", "Third Base", "Left Field", "Center Field", "Right Field", "Designated Hitter"],
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  Football: ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Offensive Line", "Defensive Line", "Linebacker", "Cornerback", "Safety", "Kicker", "Punter"],
  Soccer: ["Goalkeeper", "Center Back", "Left Back", "Right Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Wing", "Right Wing", "Striker"],
  Volleyball: ["Setter", "Outside Hitter", "Middle Blocker", "Opposite Hitter", "Libero", "Defensive Specialist"],
};

export const SPORT_STATS: Record<string, { category: string; stats: { name: string; shortName: string; value: number; positions?: string[] }[] }[]> = {
  Baseball: [
    { category: "Batting", stats: [
      { name: "At Bat", shortName: "AB", value: 0 },
      { name: "Hit", shortName: "H", value: 0 },
      { name: "Single", shortName: "1B", value: 0 },
      { name: "Double", shortName: "2B", value: 0 },
      { name: "Triple", shortName: "3B", value: 0 },
      { name: "Home Run", shortName: "HR", value: 1 },
      { name: "RBI", shortName: "RBI", value: 0 },
      { name: "Walk", shortName: "BB", value: 0 },
      { name: "Strikeout", shortName: "K", value: 0 },
    ]},
    { category: "Pitching", stats: [
      { name: "Strikeout", shortName: "K", value: 0, positions: ["Pitcher"] },
      { name: "Walk Allowed", shortName: "BB", value: 0, positions: ["Pitcher"] },
      { name: "Hit Allowed", shortName: "HA", value: 0, positions: ["Pitcher"] },
      { name: "Earned Run", shortName: "ER", value: 0, positions: ["Pitcher"] },
    ]},
    { category: "Fielding", stats: [
      { name: "Putout", shortName: "PO", value: 0 },
      { name: "Assist", shortName: "A", value: 0 },
      { name: "Error", shortName: "E", value: 0 },
    ]}
  ],
  Basketball: [
    { category: "Scoring", stats: [
      { name: "Free Throw", shortName: "FT", value: 1 },
      { name: "2-Point", shortName: "2PT", value: 2 },
      { name: "3-Point", shortName: "3PT", value: 3 },
    ]},
    { category: "Other", stats: [
      { name: "Rebound", shortName: "REB", value: 0 },
      { name: "Assist", shortName: "AST", value: 0 },
      { name: "Steal", shortName: "STL", value: 0 },
      { name: "Block", shortName: "BLK", value: 0 },
      { name: "Turnover", shortName: "TO", value: 0 },
      { name: "Foul", shortName: "PF", value: 0 },
    ]}
  ],
  Football: [
    { category: "Offense", stats: [
      { name: "Touchdown", shortName: "TD", value: 6 },
      { name: "Extra Point", shortName: "XP", value: 1 },
      { name: "2-Point Conv", shortName: "2PC", value: 2 },
      { name: "Field Goal", shortName: "FG", value: 3 },
      { name: "Safety", shortName: "SAF", value: 2 },
    ]},
    { category: "Passing", stats: [
      { name: "Completion", shortName: "CMP", value: 0, positions: ["Quarterback"] },
      { name: "Incompletion", shortName: "INC", value: 0, positions: ["Quarterback"] },
      { name: "Pass TD", shortName: "PTD", value: 6, positions: ["Quarterback"] },
      { name: "Interception", shortName: "INT", value: 0, positions: ["Quarterback"] },
    ]},
    { category: "Rushing", stats: [
      { name: "Carry", shortName: "CAR", value: 0 },
      { name: "Rush TD", shortName: "RTD", value: 6 },
    ]},
    { category: "Defense", stats: [
      { name: "Tackle", shortName: "TKL", value: 0 },
      { name: "Sack", shortName: "SCK", value: 0 },
      { name: "INT", shortName: "INT", value: 0 },
      { name: "Fumble Recovery", shortName: "FR", value: 0 },
    ]}
  ],
  Soccer: [
    { category: "Offense", stats: [
      { name: "Goal", shortName: "G", value: 1 },
      { name: "Assist", shortName: "A", value: 0 },
      { name: "Shot", shortName: "SH", value: 0 },
      { name: "Shot on Target", shortName: "SOT", value: 0 },
    ]},
    { category: "Defense", stats: [
      { name: "Save", shortName: "SV", value: 0, positions: ["Goalkeeper"] },
      { name: "Tackle", shortName: "TKL", value: 0 },
      { name: "Interception", shortName: "INT", value: 0 },
      { name: "Clearance", shortName: "CLR", value: 0 },
    ]},
    { category: "Discipline", stats: [
      { name: "Yellow Card", shortName: "YC", value: 0 },
      { name: "Red Card", shortName: "RC", value: 0 },
      { name: "Foul", shortName: "FL", value: 0 },
    ]}
  ],
  Volleyball: [
    { category: "Offense", stats: [
      { name: "Kill", shortName: "K", value: 1 },
      { name: "Assist", shortName: "A", value: 0 },
      { name: "Ace", shortName: "ACE", value: 1 },
    ]},
    { category: "Defense", stats: [
      { name: "Dig", shortName: "DIG", value: 0 },
      { name: "Block", shortName: "BLK", value: 1 },
    ]},
    { category: "Errors", stats: [
      { name: "Attack Error", shortName: "AE", value: 0 },
      { name: "Service Error", shortName: "SE", value: 0 },
      { name: "Ball Handling Error", shortName: "BHE", value: 0 },
    ]}
  ]
};
