export type IcVote = "yes" | "no" | "abstain" | "pending";

export type IcAgendaItem = {
  dealId: string;
  type: "final_decision" | "indicative_offer" | "update";
  memoStatus: "ready" | "draft";
  pendingReview: number;
  votes: { memberId: string; vote: IcVote }[];
};

export type IcMeeting = {
  id: string;
  number: number;
  date: string;
  status: "upcoming" | "past";
  agenda: IcAgendaItem[];
  minutes?: string;
};

export const icMeetings: IcMeeting[] = [
  {
    id: "ic-2026-w18",
    number: 14,
    date: "2026-05-04T13:00:00Z",
    status: "upcoming",
    agenda: [
      {
        dealId: "nordiccare",
        type: "final_decision",
        memoStatus: "ready",
        pendingReview: 0,
        votes: [
          { memberId: "u1", vote: "pending" },
          { memberId: "u5", vote: "pending" },
        ],
      },
      {
        dealId: "vivara",
        type: "indicative_offer",
        memoStatus: "draft",
        pendingReview: 3,
        votes: [
          { memberId: "u1", vote: "pending" },
          { memberId: "u5", vote: "pending" },
        ],
      },
    ],
  },
  {
    id: "ic-2026-w20",
    number: 15,
    date: "2026-05-18T13:00:00Z",
    status: "upcoming",
    agenda: [
      {
        dealId: "helios",
        type: "final_decision",
        memoStatus: "draft",
        pendingReview: 5,
        votes: [
          { memberId: "u1", vote: "pending" },
          { memberId: "u5", vote: "pending" },
        ],
      },
    ],
  },
  {
    id: "ic-2026-w16",
    number: 13,
    date: "2026-04-20T13:00:00Z",
    status: "past",
    minutes:
      "BeNeLux Industries: 2 yes / 0 no — approved at €138M EV (11.0× EBITDA). Atlantica Marine: 0 yes / 2 no — passed; thesis fit too low and EBITDA quality concerns unresolved.",
    agenda: [
      {
        dealId: "benelux",
        type: "final_decision",
        memoStatus: "ready",
        pendingReview: 0,
        votes: [
          { memberId: "u1", vote: "yes" },
          { memberId: "u5", vote: "yes" },
        ],
      },
      {
        dealId: "atlantica",
        type: "final_decision",
        memoStatus: "ready",
        pendingReview: 0,
        votes: [
          { memberId: "u1", vote: "no" },
          { memberId: "u5", vote: "no" },
        ],
      },
    ],
  },
];

export function getMeeting(id: string): IcMeeting | undefined {
  return icMeetings.find((m) => m.id === id);
}
