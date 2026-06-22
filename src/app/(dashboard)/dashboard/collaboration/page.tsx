"use client";

import React, { useState, useEffect } from "react";
import { 
  getFriendsAction, 
  sendFriendRequestAction, 
  acceptFriendRequestAction,
  getPendingInvitesAction,
  acceptCollectionInviteAction,
  getSharedCollectionsAction
} from "@/actions/collaboration/collaboration-actions";
import { Friendship, CollectionInvite, SharedCollection } from "@/types/collaboration/collaboration.types";
import { 
  Users, 
  UserPlus, 
  Mail, 
  FolderHeart, 
  FolderSymlink, 
  Check, 
  Clock, 
  FolderOpen
} from "lucide-react";

export default function CollaborationDashboard() {
  const [activeTab, setActiveTab] = useState<"friends" | "shared">("friends");

  // Friend state
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [friendEmailInput, setFriendEmailInput] = useState("");
  
  // Shared state
  const [sharedWithMe, setSharedWithMe] = useState<SharedCollection[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedCollection[]>([]);
  const [collectionInvites, setCollectionInvites] = useState<CollectionInvite[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAllData = React.useCallback(async () => {
    setIsLoading(true);
    
    const [friendsRes, invitesRes, sharedRes] = await Promise.all([
      getFriendsAction(),
      getPendingInvitesAction(),
      getSharedCollectionsAction()
    ]);

    if (friendsRes.success && friendsRes.data) {
      setFriends(friendsRes.data.friends || []);
      setFriendRequests(friendsRes.data.incomingRequests || []);
    }

    if (invitesRes.success && invitesRes.data) {
      setCollectionInvites(invitesRes.data);
    }

    if (sharedRes.success && sharedRes.data) {
      setSharedWithMe(sharedRes.data.sharedWithMe || []);
      setSharedByMe(sharedRes.data.sharedByMe || []);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();
  }, [loadAllData]);

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmailInput.trim()) return;
    
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });
    
    const res = await sendFriendRequestAction({ email: friendEmailInput.trim() });
    
    if (res.success) {
      setMessage({ text: "Friend request sent successfully!", type: "success" });
      setFriendEmailInput("");
      await loadAllData();
    } else {
      setMessage({ text: res.error || "Failed to send request", type: "error" });
    }
    
    setIsSubmitting(false);
  };

  const handleAcceptFriend = async (requesterId: string) => {
    const res = await acceptFriendRequestAction(requesterId);
    if (res.success) {
      await loadAllData();
    }
  };

  const handleAcceptCollection = async (inviteId: string) => {
    const res = await acceptCollectionInviteAction(inviteId);
    if (res.success) {
      await loadAllData();
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading collaboration center...</div>;
  }

  const acceptedFriends = friends.filter(f => f.status === "accepted");
  const pendingOutgoing = friends.filter(f => f.status === "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Collaboration Center
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect with friends, share workspaces, and collaborate on your university revision materials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "friends" 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Friends & Network
          {(friendRequests.length > 0) && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              {friendRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("shared")}
          className={`px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "shared" 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderSymlink className="h-4 w-4" />
          Shared Workspaces
          {(collectionInvites.length > 0) && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              {collectionInvites.length}
            </span>
          )}
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {/* Add Friend */}
            <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                Add a Friend
              </h3>
              
              <form onSubmit={handleSendFriendRequest} className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={friendEmailInput}
                    onChange={(e) => setFriendEmailInput(e.target.value)}
                    placeholder="Friend's email address"
                    className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !friendEmailInput}
                  className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-md flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Send Request
                </button>
                {message.text && (
                  <p className={`text-xs font-semibold ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                    {message.text}
                  </p>
                )}
              </form>
            </div>

            {/* Pending Incoming */}
            {friendRequests.length > 0 && (
              <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Incoming Requests
                </h3>
                <div className="space-y-3">
                  {friendRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase">
                          {req.requester?.name?.[0] || req.requester?.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{req.requester?.name || req.requester?.email}</p>
                          <p className="text-[10px] text-muted-foreground">{req.requester?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptFriend(req.user_id)}
                        className="h-7 w-7 bg-primary text-primary-foreground rounded-md flex items-center justify-center hover:bg-primary/90 transition-colors"
                        title="Accept"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pending Outgoing */}
            {pendingOutgoing.length > 0 && (
              <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Sent Requests
                </h3>
                <div className="space-y-2">
                  {pendingOutgoing.map(req => (
                    <div key={req.id} className="text-sm text-muted-foreground flex items-center gap-2 p-2 bg-muted/20 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      Pending request to {req.friend?.email || "user"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 border border-border bg-card rounded-xl shadow-sm overflow-hidden">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Your Friends ({acceptedFriends.length})
              </span>
            </div>
            
            <div className="p-6">
              {acceptedFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                  <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium">No friends yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send a friend request using their email address to start sharing collections.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {acceptedFriends.map(f => (
                    <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors">
                       <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg uppercase border border-primary/20">
                          {f.friend?.name?.[0] || f.friend?.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground line-clamp-1">{f.friend?.name || f.friend?.email?.split('@')[0]}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{f.friend?.email}</p>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared Workspaces Tab */}
      {activeTab === "shared" && (
        <div className="space-y-6">
          {/* Incoming Invites Alert */}
          {collectionInvites.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm space-y-4">
               <h3 className="font-semibold text-sm tracking-wide uppercase text-primary flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  New Workspace Invitations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collectionInvites.map(invite => (
                    <div key={invite.id} className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {invite.collection?.name || "A Collection"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            From: {invite.inviter?.name || invite.inviter?.email}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {invite.permission} access
                        </span>
                      </div>
                      <button
                        onClick={() => handleAcceptCollection(invite.id)}
                        className="w-full mt-2 h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-md transition-colors"
                      >
                        Accept Invitation
                      </button>
                    </div>
                  ))}
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shared With Me */}
            <div className="border border-border bg-card rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <FolderHeart className="h-4 w-4 text-primary" />
                  Shared With Me
                </span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {sharedWithMe.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                    <FolderSymlink className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-medium">No shared collections</p>
                    <p className="text-xs mt-0.5">Workspaces friends share with you will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedWithMe.map(share => (
                      <div key={share.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0`} style={{ backgroundColor: share.collection?.color || '#3b82f6', opacity: 0.15 }}>
                           </div>
                           <div className="absolute ml-2.5 mt-0.5">
                             <FolderOpen className="h-5 w-5" style={{ color: share.collection?.color || '#3b82f6' }} />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-foreground">{share.collection?.name}</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5">Owner: {share.owner?.name || share.owner?.email?.split('@')[0]}</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                          {share.permission}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shared By Me */}
            <div className="border border-border bg-card rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <FolderSymlink className="h-4 w-4 text-primary" />
                  Shared By Me
                </span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {sharedByMe.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                    <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-medium">You haven&apos;t shared anything</p>
                    <p className="text-xs mt-0.5">Go to your collections to invite friends.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedByMe.map(share => (
                      <div key={share.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 border border-border bg-muted/50`}>
                             <FolderOpen className="h-4 w-4 text-muted-foreground" />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-foreground">{share.collection?.name}</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5">Shared with: {(share as SharedCollection & { shared_with?: { name: string; email: string } }).shared_with?.name || (share as SharedCollection & { shared_with?: { name: string; email: string } }).shared_with?.email}</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                          {share.permission}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
