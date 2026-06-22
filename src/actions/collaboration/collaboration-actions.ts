"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CollaborationService } from "@/server/collaboration/collaboration-service";
import { CollectionPermission } from "@/types/collaboration/collaboration.types";

const sendFriendRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const acceptFriendRequestSchema = z.object({
  requesterId: z.string().uuid(),
});

const inviteToCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  email: z.string().email("Invalid email address"),
  permission: z.enum(["view", "edit", "owner"]),
});

const acceptInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

export async function sendFriendRequestAction(formData: { email: string }) {
  try {
    const validated = sendFriendRequestSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    await CollaborationService.sendFriendRequest(user.id, validated.email);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to send friend request",
    };
  }
}

export async function acceptFriendRequestAction(requesterId: string) {
  try {
    const validated = acceptFriendRequestSchema.parse({ requesterId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    await CollaborationService.acceptFriendRequest(user.id, validated.requesterId);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to accept friend request",
    };
  }
}

export async function getFriendsAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    const data = await CollaborationService.getFriends(user.id);
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch friends",
    };
  }
}

export async function inviteToCollectionAction(formData: {
  collectionId: string;
  email: string;
  permission: CollectionPermission;
}) {
  try {
    const validated = inviteToCollectionSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    await CollaborationService.inviteToCollection(
      user.id,
      validated.collectionId,
      validated.email,
      validated.permission
    );

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to send collection invite",
    };
  }
}

export async function getPendingInvitesAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) throw new Error("Unauthorized. Please log in.");

    const data = await CollaborationService.getPendingInvites(user.email);
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch pending invites",
    };
  }
}

export async function acceptCollectionInviteAction(inviteId: string) {
  try {
    const validated = acceptInviteSchema.parse({ inviteId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) throw new Error("Unauthorized. Please log in.");

    await CollaborationService.acceptCollectionInvite(user.id, user.email, validated.inviteId);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to accept collection invite",
    };
  }
}

export async function getSharedCollectionsAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    const [sharedWithMe, sharedByMe] = await Promise.all([
      CollaborationService.getSharedWithMe(user.id),
      CollaborationService.getSharedByMe(user.id)
    ]);

    return { 
      success: true, 
      data: { sharedWithMe, sharedByMe }
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch shared collections",
    };
  }
}
