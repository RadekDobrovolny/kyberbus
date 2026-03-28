export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value as UserRole);

export const normalizeUserRole = (value: unknown): UserRole =>
  value === "ADMIN" ? "ADMIN" : "USER";

export const POST_TYPE_CONFIG = {
  INSTAX: {
    label: "Instax",
    maxLength: 50,
    requiresImage: true,
    adminOnly: false
  },
  LEPIK: {
    label: "Lepík",
    maxLength: 200,
    requiresImage: false,
    adminOnly: false
  },
  DISPECINK: {
    label: "Dispečink",
    maxLength: 200,
    requiresImage: false,
    adminOnly: true
  },
  MESTO: {
    label: "Město",
    maxLength: 100,
    requiresImage: false,
    adminOnly: true
  }
} as const;

export type PostType = keyof typeof POST_TYPE_CONFIG;

export const ALL_POST_TYPES = Object.keys(POST_TYPE_CONFIG) as PostType[];

export const isPostType = (value: unknown): value is PostType =>
  typeof value === "string" && value in POST_TYPE_CONFIG;

export const getPostMaxLength = (type: PostType) => POST_TYPE_CONFIG[type].maxLength;

export const postTypeRequiresImage = (type: PostType) => POST_TYPE_CONFIG[type].requiresImage;

export const canCreatePostType = (role: UserRole, type: PostType) =>
  role === "ADMIN" || !POST_TYPE_CONFIG[type].adminOnly;

export const getAllowedPostTypes = (role: UserRole): PostType[] =>
  ALL_POST_TYPES.filter((type) => canCreatePostType(role, type));
