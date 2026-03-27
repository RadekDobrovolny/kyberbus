export type AuthUser = {
  id: string;
  login: string;
  shortName: string;
  bio: string;
  contact: string;
  profilePhotoPath: string;
  createdAt: number;
};

export type FeedItem = {
  id: string;
  type: "INSTAX" | "LEPIK";
  textContent: string;
  imagePath: string | null;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  authorShortName: string;
  authorPhotoPath: string;
};
