"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  FolderOpen,
  X,
  Calendar,
  ArrowLeft,
  ExternalLink,
  FileText,
  StickyNote,
  BookOpen,
  HelpCircle,
  FolderPlus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCollectionsAction,
  createCollectionAction,
  deleteCollectionAction,
  addItemToCollectionAction,
  removeItemFromCollectionAction,
  getCollectionItemsAction, 
  getAvailableWorkspaceAssetsAction
} from "@/actions/workspace/workspace-actions";
import { Collection, ResolvedCollectionItem } from "@/types/workspace/workspace.types";
import { getIconComponent, getColorPreset, WORKSPACE_ICONS, WORKSPACE_COLORS } from "@/lib/workspace/utils";
import CommentThread from "@/components/comments/CommentThread";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionItems, setCollectionItems] = useState<ResolvedCollectionItem[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Create Collection Form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("Folder");
  const [newColor, setNewColor] = useState("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Item Modal state
  const [assets, setAssets] = useState<{
    files: Array<{ id: string; title: string; type: string }>;
    notes: Array<{ id: string; title: string; type: string; sub?: string }>;
    flashcards: Array<{ id: string; title: string; type: string }>;
    quizzes: Array<{ id: string; title: string; type: string }>;
  }>({ files: [], notes: [], flashcards: [], quizzes: [] });
  const [activeTab, setActiveTab] = useState<"file" | "note" | "flashcard" | "quiz">("file");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);



  useEffect(() => {
    async function init() {
      setIsLoadingCollections(true);
      const res = await getCollectionsAction();
      if (res.success && res.data) {
        setCollections(res.data);
      } else {
        toast.error(res.error || "Failed to load collections");
      }
      setIsLoadingCollections(false);
    }
    init();
  }, []);

  // Load collection items
  const loadCollectionItems = async (collectionId: string) => {
    setIsLoadingItems(true);
    const res = await getCollectionItemsAction({ collectionId });
    if (res.success && res.data) {
      setCollectionItems(res.data);
    } else {
      toast.error(res.error || "Failed to load collection items");
    }
    setIsLoadingItems(false);
  };

  useEffect(() => {
    if (selectedCollection) {
      const collectionId = selectedCollection.id;
      async function fetchItems() {
        setIsLoadingItems(true);
        const res = await getCollectionItemsAction({ collectionId });
        if (res.success && res.data) {
          setCollectionItems(res.data);
        } else {
          toast.error(res.error || "Failed to load collection items");
        }
        setIsLoadingItems(false);
      }
      fetchItems();
    }
  }, [selectedCollection]);

  // Load available assets when "Add Item" modal opens
  const openAddItemModal = async () => {
    setIsAddOpen(true);
    setIsLoadingAssets(true);
    const res = await getAvailableWorkspaceAssetsAction();
    if (res.success && res.data) {
      setAssets(res.data);
    } else {
      toast.error(res.error || "Failed to load workspace assets");
    }
    setIsLoadingAssets(false);
  };

  // Handlers
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Collection name is required");
      return;
    }
    setIsSubmitting(true);
    const res = await createCollectionAction({
      name: newName.trim(),
      description: newDesc.trim() || null,
      icon: newIcon,
      color: newColor,
    });
    if (res.success && res.data) {
      toast.success("Collection created successfully!");
      setCollections([res.data, ...collections]);
      setIsCreateOpen(false);
      // Reset form
      setNewName("");
      setNewDesc("");
      setNewIcon("Folder");
      setNewColor("blue");
    } else {
      toast.error(res.error || "Failed to create collection");
    }
    setIsSubmitting(false);
  };

  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this collection? All item groupings will be removed (source files will not be deleted).")) {
      return;
    }
    const res = await deleteCollectionAction({ id });
    if (res.success) {
      toast.success("Collection deleted");
      setCollections(collections.filter((c) => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    } else {
      toast.error(res.error || "Failed to delete collection");
    }
  };

  const handleAddItem = async (itemId: string, itemType: "file" | "note" | "flashcard" | "quiz") => {
    if (!selectedCollection) return;
    const res = await addItemToCollectionAction({
      collectionId: selectedCollection.id,
      itemType,
      itemId,
    });
    if (res.success && res.data) {
      toast.success("Item added to collection");
      loadCollectionItems(selectedCollection.id);
    } else {
      toast.error(res.error || "Failed to add item to collection");
    }
  };

  const handleRemoveItem = async (collectionItemId: string) => {
    if (!selectedCollection) return;
    const res = await removeItemFromCollectionAction({
      collectionId: selectedCollection.id,
      collectionItemId,
    });
    if (res.success) {
      toast.success("Item removed from collection");
      setCollectionItems(collectionItems.filter((item) => item.id !== collectionItemId));
    } else {
      toast.error(res.error || "Failed to remove item");
    }
  };

  const getFilteredAssets = () => {
    let list: Array<{ id: string; title: string; type: string; sub?: string }> = [];
    if (activeTab === "file") list = assets.files;
    if (activeTab === "note") list = assets.notes;
    if (activeTab === "flashcard") list = assets.flashcards;
    if (activeTab === "quiz") list = assets.quizzes;

    // Filter by query
    if (searchQuery.trim()) {
      list = list.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return list;
  };

  const isItemInCollection = (itemId: string) => {
    return collectionItems.some((item) => item.item_id === itemId);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "file":
        return <FileText className="h-4 w-4" />;
      case "note":
        return <StickyNote className="h-4 w-4" />;
      case "flashcard":
        return <BookOpen className="h-4 w-4" />;
      case "quiz":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getItemLink = (type: string) => {
    switch (type) {
      case "note":
        return "/ai/notes";
      case "flashcard":
        return "/ai/flashcards";
      case "quiz":
        return "/ai/quiz";
      default:
        return "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize study materials, notes, quizzes, and flashcards into folders
          </p>
        </div>
        {!selectedCollection && (
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Collection
          </Button>
        )}
      </div>

      {/* Grid view of Collections */}
      {!selectedCollection && (
        <>
          {isLoadingCollections ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass p-5 rounded-xl animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-border flex flex-col items-center justify-center max-w-lg mx-auto mt-12 space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <FolderPlus className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">No Collections Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first collection folder to bundle files, revision cram sheets, flashcard decks, and practice tests.
                </p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)} className="mt-2">
                Create Collection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {collections.map((col) => {
                const IconComp = getIconComponent(col.icon);
                const colorPreset = getColorPreset(col.color);

                return (
                  <div
                    key={col.id}
                    onClick={() => setSelectedCollection(col)}
                    className="glass group cursor-pointer border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 rounded-xl p-5 flex flex-col justify-between h-48 relative overflow-hidden"
                  >
                    {/* Color Glow Indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${colorPreset.accent}`} />

                    <div>
                      <div className="flex items-start justify-between">
                        {/* Custom Category Icon */}
                        <div className={`p-2.5 rounded-lg border ${colorPreset.bg} ${colorPreset.text} ${colorPreset.border}`}>
                          <IconComp className="h-5 w-5" />
                        </div>

                        {/* Actions */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteCollection(col.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="font-bold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {col.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {col.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground border-t border-border/50 pt-3 mt-4">
                      <Calendar className="h-3 w-3" />
                      <span>Created {new Date(col.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Expanded Collection Detail View */}
      {selectedCollection && (
        <div className="space-y-6">
          {/* Back Action Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedCollection(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Collections
            </button>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openAddItemModal}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  handleDeleteCollection(selectedCollection.id, e);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Folder
              </Button>
            </div>
          </div>

          {/* Collection Metadata Card */}
          {(() => {
            const IconComp = getIconComponent(selectedCollection.icon);
            const colorPreset = getColorPreset(selectedCollection.color);

            return (
              <div className="glass rounded-xl p-6 border border-border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className={`absolute top-0 bottom-0 left-0 w-2 ${colorPreset.accent}`} />
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl border ${colorPreset.bg} ${colorPreset.text} ${colorPreset.border} shrink-0`}>
                    <IconComp className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-foreground">{selectedCollection.name}</h2>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {selectedCollection.description || "No description provided for this collection workspace."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Item Listing */}
          <div className="glass rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-sm text-foreground">Collection Items</h3>
            </div>

            {isLoadingItems ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading workspace items...</span>
              </div>
            ) : collectionItems.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">This collection is empty</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click the &quot;Add Item&quot; button above to bundle files, notes, decks, or quizzes into this workspace folder.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={openAddItemModal}>
                  Add your first item
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {collectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-card border border-border text-primary group-hover:scale-105 transition-transform">
                        {getItemIcon(item.item_type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-foreground line-clamp-1">{item.title}</h4>
                        <span className="text-xs text-muted-foreground capitalize">{item.description}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.item_type === "file" ? (
                        <a
                          href={getItemLink(item.item_type)} // placeholder or resolved file link, let's keep it simple
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium border border-border bg-background hover:bg-muted hover:text-foreground cursor-pointer gap-1"
                        >
                          Open File <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <a
                          href={getItemLink(item.item_type)}
                          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium border border-border bg-background hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          View {item.item_type}
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discussion Thread */}
          <div className="glass rounded-xl border border-border overflow-hidden lg:h-[600px]">
            <CommentThread entityType="collection" entityId={selectedCollection.id} />
          </div>
        </div>
      )}

      {/* CREATE COLLECTION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-foreground">New Collection</h2>
              <p className="text-xs text-muted-foreground">Create a subject folder or study workspace</p>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. DSA, DBMS Exam Study Pack"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Subject details, dates, course codes..."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                />
              </div>

              {/* Icon Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Select Icon</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(WORKSPACE_ICONS).map((iconName) => {
                    const IconComp = WORKSPACE_ICONS[iconName];
                    const isActive = newIcon === iconName;
                    return (
                      <button
                        type="button"
                        key={iconName}
                        onClick={() => setNewIcon(iconName)}
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <IconComp className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Select Theme Color</label>
                <div className="flex gap-3 justify-center py-1">
                  {Object.keys(WORKSPACE_COLORS).map((colorName) => {
                    const preset = WORKSPACE_COLORS[colorName];
                    const isActive = newColor === colorName;
                    return (
                      <button
                        type="button"
                        key={colorName}
                        onClick={() => setNewColor(colorName)}
                        className={`h-8 w-8 rounded-full ${preset.accent} border-2 transition-all flex items-center justify-center text-white cursor-pointer ${
                          isActive ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"
                        }`}
                        title={preset.name}
                      >
                        {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ITEM TO COLLECTION MODAL */}
      {isAddOpen && selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-foreground">Add to {selectedCollection.name}</h2>
              <p className="text-xs text-muted-foreground">Choose workspace files or revision notes to bundle</p>
            </div>

            {/* Asset Tabs */}
            <div className="flex border-b border-border/60">
              {(["file", "note", "flashcard", "quiz"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchQuery("");
                  }}
                  className={`flex-1 py-2 text-xs font-semibold border-b-2 capitalize transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}s
                </button>
              ))}
            </div>

            {/* Tab Search Filter */}
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search user ${activeTab}s...`}
                className="w-full text-xs"
              />
            </div>

            {/* Asset Items List */}
            <div className="flex-1 overflow-y-auto min-h-[250px] space-y-2 pr-1">
              {isLoadingAssets ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Loading workspace assets...</span>
                </div>
              ) : getFilteredAssets().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-muted-foreground">No assets found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {getFilteredAssets().map((asset) => {
                    const exists = isItemInCollection(asset.id);
                    return (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-card/50 hover:bg-card border border-border/40 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-muted-foreground">{getItemIcon(asset.type)}</div>
                          <div>
                            <span className="font-semibold text-foreground line-clamp-1">{asset.title}</span>
                            {asset.sub && <span className="text-[10px] text-muted-foreground block">{asset.sub}</span>}
                          </div>
                        </div>

                        {exists ? (
                          <span className="text-[10px] text-muted-foreground font-semibold px-2 py-1 rounded bg-muted">
                            Added
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-[10px]"
                            onClick={() => handleAddItem(asset.id, activeTab)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40">
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
