import { createClient } from "@/lib/supabase/server";
import {
  Friendship,
  CollectionInvite,
  SharedCollection,
  CollectionPermission,
} from "@/types/collaboration/collaboration.types";

export class CollaborationService {
  // ==========================================
  // Friendships
  // ==========================================

  /**
   * Send a friend request by email.
   */
  static async sendFriendRequest(userId: string, friendEmail: string): Promise<void> {
    const supabase = await createClient();

    // 1. Find user by email
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", friendEmail)
      .limit(1);

    if (userError || !users || users.length === 0) {
      throw new Error("User with that email not found.");
    }

    const friendId = users[0].id;

    if (friendId === userId) {
      throw new Error("You cannot send a friend request to yourself.");
    }

    // 2. Check if already friends or pending
    const { data: existing, error: checkError } = await supabase
      .from("friendships")
      .select("status")
      .eq("user_id", userId)
      .eq("friend_id", friendId)
      .maybeSingle();

    if (existing) {
      throw new Error(`Friendship request is already ${existing.status}.`);
    }

    // 3. Insert pending request
    const { error: insertError } = await supabase.from("friendships").insert({
      user_id: userId,
      friend_id: friendId,
      status: "pending",
    });

    if (insertError) {
      throw new Error("Failed to send friend request: " + insertError.message);
    }
  }

  /**
   * Accept a pending friend request.
   */
  static async acceptFriendRequest(userId: string, requesterId: string): Promise<void> {
    const supabase = await createClient();

    // The request was sent BY requester TO user (so user_id = requester, friend_id = user)
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("user_id", requesterId)
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (error) {
      throw new Error("Failed to accept friend request: " + error.message);
    }

    // Also insert the reverse relationship for bidirectional query simplicity
    await supabase.from("friendships").upsert(
      {
        user_id: userId,
        friend_id: requesterId,
        status: "accepted",
      },
      { onConflict: "user_id, friend_id" }
    ).select();
  }

  /**
   * List all friends (accepted and pending).
   */
  static async getFriends(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        friend:users!friendships_friend_id_fkey(id, name, email, avatar)
      `)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to fetch friends: " + error.message);
    }

    // Also get incoming pending requests where user is the friend_id
    const { data: incoming, error: incomingError } = await supabase
      .from("friendships")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        requester:users!friendships_user_id_fkey(id, name, email, avatar)
      `)
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (incomingError) {
      throw new Error("Failed to fetch incoming requests: " + incomingError.message);
    }

    return {
      friends: data as unknown as Friendship[],
      incomingRequests: incoming as any[],
    };
  }

  // ==========================================
  // Collection Sharing
  // ==========================================

  /**
   * Invite someone to a collection via email.
   */
  static async inviteToCollection(
    userId: string,
    collectionId: string,
    inviteeEmail: string,
    permission: CollectionPermission
  ): Promise<void> {
    const supabase = await createClient();

    // Verify ownership or owner rights
    const { data: coll } = await supabase
      .from("collections")
      .select("user_id")
      .eq("id", collectionId)
      .maybeSingle();

    if (!coll || coll.user_id !== userId) {
      // Check shared collections
      const { data: shared } = await supabase
        .from("shared_collections")
        .select("permission")
        .eq("collection_id", collectionId)
        .eq("shared_with_user_id", userId)
        .eq("permission", "owner")
        .maybeSingle();

      if (!shared) {
        throw new Error("You do not have permission to invite users to this collection.");
      }
    }

    const { error } = await supabase.from("collection_invites").insert({
      collection_id: collectionId,
      inviter_id: userId,
      invitee_email: inviteeEmail,
      status: "pending",
      permission,
    });

    if (error) {
      throw new Error("Failed to send collection invite: " + error.message);
    }
  }

  /**
   * Get pending invites for the current user's email.
   */
  static async getPendingInvites(userEmail: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("collection_invites")
      .select(`
        id,
        collection_id,
        inviter_id,
        invitee_email,
        status,
        permission,
        created_at,
        collection:collections(name),
        inviter:users!collection_invites_inviter_id_fkey(name, email, avatar)
      `)
      .eq("invitee_email", userEmail)
      .eq("status", "pending");

    if (error) {
      throw new Error("Failed to fetch pending invites: " + error.message);
    }

    return data as unknown as CollectionInvite[];
  }

  /**
   * Accept an invite to a collection.
   */
  static async acceptCollectionInvite(userId: string, userEmail: string, inviteId: string): Promise<void> {
    const supabase = await createClient();

    // 1. Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("collection_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("invitee_email", userEmail)
      .maybeSingle();

    if (inviteError || !invite) {
      throw new Error("Invite not found or unauthorized.");
    }

    if (invite.status !== "pending") {
      throw new Error("Invite is already " + invite.status);
    }

    // 2. Mark accepted
    await supabase
      .from("collection_invites")
      .update({ status: "accepted" })
      .eq("id", inviteId);

    // 3. Insert into shared_collections
    const { error: sharedError } = await supabase.from("shared_collections").insert({
      collection_id: invite.collection_id,
      shared_with_user_id: userId,
      permission: invite.permission,
    });

    if (sharedError) {
      throw new Error("Failed to add to shared collections: " + sharedError.message);
    }
  }

  /**
   * Get collections shared WITH the user.
   */
  static async getSharedWithMe(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shared_collections")
      .select(`
        id,
        collection_id,
        shared_with_user_id,
        permission,
        created_at,
        collection:collections(name, description, icon, color, user_id)
      `)
      .eq("shared_with_user_id", userId);

    if (error) {
      throw new Error("Failed to fetch shared collections: " + error.message);
    }

    // Resolve owner details for each collection
    const resolved = await Promise.all(
      (data || []).map(async (sc: any) => {
        if (sc.collection && sc.collection.user_id) {
          const { data: owner } = await supabase
            .from("users")
            .select("id, name, email, avatar")
            .eq("id", sc.collection.user_id)
            .maybeSingle();
          sc.owner = owner;
        }
        return sc;
      })
    );

    return resolved as unknown as SharedCollection[];
  }

  /**
   * Get collections the user has shared WITH OTHERS.
   */
  static async getSharedByMe(userId: string) {
    const supabase = await createClient();

    // First find collections owned by the user that have entries in shared_collections
    const { data: collections, error: collError } = await supabase
      .from("collections")
      .select("id, name, icon, color")
      .eq("user_id", userId);

    if (collError) throw new Error("Failed to fetch collections.");
    
    if (!collections || collections.length === 0) return [];

    const collectionIds = collections.map(c => c.id);

    const { data: shares, error: shareError } = await supabase
      .from("shared_collections")
      .select(`
        id,
        collection_id,
        shared_with_user_id,
        permission,
        created_at,
        shared_with:users!shared_collections_shared_with_user_id_fkey(id, name, email, avatar)
      `)
      .in("collection_id", collectionIds);

    if (shareError) throw new Error("Failed to fetch outgoing shares.");

    return shares.map(share => {
      const coll = collections.find(c => c.id === share.collection_id);
      return {
        ...share,
        collection: coll
      };
    }) as unknown as SharedCollection[];
  }
}
