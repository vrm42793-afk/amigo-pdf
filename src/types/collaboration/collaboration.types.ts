export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type CollectionPermission = "view" | "edit" | "owner";
export type InviteStatus = "pending" | "accepted" | "declined";

export interface FriendProfile {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  friend?: FriendProfile; // Joined profile
  requester?: FriendProfile; // Joined incoming request
}

export interface CollectionInvite {
  id: string;
  collection_id: string;
  inviter_id: string;
  invitee_email: string;
  status: InviteStatus;
  permission: CollectionPermission;
  created_at: string;
  collection?: { name: string }; // Joined
  inviter?: FriendProfile; // Joined
}

export interface SharedCollection {
  id: string;
  collection_id: string;
  shared_with_user_id: string;
  permission: CollectionPermission;
  created_at: string;
  collection?: { name: string; description?: string | null; icon: string; color: string; user_id: string }; // Joined
  owner?: FriendProfile; // Joined
}
