import type { NoticeLevel } from "~~/shared/content";
import type { ReactionCounts, ViewerReactions } from "~~/shared/reactions";

export type AuthUser = {
  id: string;
  login: string;
  role: "USER" | "ADMIN";
  shortName: string;
  bio: string;
  contact: string;
  profilePhotoPath: string;
  createdAt: number;
};

export type FeedItem = {
  id: string;
  type: "INSTAX" | "LEPIK" | "DISPECINK" | "MESTO";
  noticeLevel: NoticeLevel;
  textContent: string;
  imagePath: string | null;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  authorShortName: string;
  authorPhotoPath: string;
  reactions: ReactionCounts;
  viewerReactions: ViewerReactions;
};
