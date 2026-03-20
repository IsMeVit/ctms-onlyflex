"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import HallList from "./_components/HallList";
import HallDetailPanel from "./_components/HallDetailPanel";
import HallForm from "./_components/HallForm";
import HallDeleteConfirmModal from "./_components/HallDeleteConfirmModal";
import { RowConfig } from "@/lib/hall-utils";
import { usePolling } from "@/lib/use-polling";

interface Hall {
  id: string;
  name: string;
  hallType: string;
  screenType: string;
  capacity: number;
  rows: number;
  columns: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  seats?: Array<{
    id: string;
    row: string;
    column: number;
    seatNumber: number | null;
    seatType: string;
    status: string;
  }>;
  rowConfigs?: RowConfig[];
  _count: {
    showtimes: number;
    seats: number;
  };
}

interface HallFormData {
  name: string;
  hallType: string;
  screenType: string;
  rows: number;
  columns: number;
  isActive: boolean;
  rowConfigs: RowConfig[];
}

export default function AdminHallsPage() {
  // Data state
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [hallToDelete, setHallToDelete] = useState<Hall | null>(null);

  // Mobile view state
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-clear success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch halls
  const fetchHalls = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("includeSeats", "true");

      const response = await fetch(`/api/admin/halls?${params}`);
      const data = await response.json();

      if (response.ok) {
        setHalls(data.halls);
        // Auto-select first hall if none selected or current selection not in list
        if (data.halls.length > 0) {
          const currentSelectedExists = selectedHall
            ? data.halls.find((h: Hall) => h.id === selectedHall.id)
            : false;
          
          if (currentSelectedExists && selectedHall) {
            // Update with fresh data from server
            const updatedHall = data.halls.find((h: Hall) => h.id === selectedHall.id);
            if (updatedHall) {
              setSelectedHall(updatedHall);
            }
          } else {
            setSelectedHall(data.halls[0]);
          }
        } else {
          setSelectedHall(null);
        }
      } else {
        setError(data.error || "Failed to fetch halls");
      }
    } catch {
      setError("Failed to fetch halls");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter, selectedHall]);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  // Polling for live updates - pause when form is open (editing)
  usePolling({
    interval: 5000,
    enabled: !isFormOpen,
    onPoll: fetchHalls,
  });

  // Handle hall selection
  const handleSelectHall = (hall: Hall) => {
    setSelectedHall(hall);
    if (isMobile) {
      setMobileView("detail");
    }
  };

  // Handle create hall
  const handleCreateHall = async (formData: HallFormData) => {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/halls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFormOpen(false);
        await fetchHalls();
        // Select the newly created hall
        if (data.hall) {
          setSelectedHall(data.hall);
        }
      } else {
        setError(data.error || "Failed to create hall");
      }
    } catch {
      setError("Failed to create hall");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update hall
  const handleUpdateHall = async (formData: HallFormData) => {
    if (!editingHall) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/halls/${editingHall.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFormOpen(false);
        setEditingHall(null);
        await fetchHalls();
      } else {
        setError(data.error || "Failed to update hall");
      }
    } catch {
      setError("Failed to update hall");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete hall
  const handleDeleteHall = async () => {
    if (!hallToDelete) return;

    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/halls/${hallToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        await fetchHalls();
        setSelectedHall(null);
        setSuccessMessage(data.message || `Hall "${hallToDelete.name}" deleted successfully`);
      } else {
        setError(data.error || "Failed to delete hall");
      }
    } catch {
      setError("Failed to delete hall");
    } finally {
      setIsUpdating(false);
      setIsDeleteConfirmOpen(false);
      setHallToDelete(null);
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirm = () => {
    if (!selectedHall) return;
    setHallToDelete(selectedHall);
    setIsDeleteConfirmOpen(true);
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!selectedHall) return;

    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/halls/${selectedHall.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !selectedHall.isActive }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchHalls();
      } else {
        setError(data.error || "Failed to update status");
      }
    } catch {
      setError("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Open edit modal
  const handleEditClick = () => {
    if (!selectedHall) return;
    setEditingHall(selectedHall);
    setIsFormOpen(true);
  };

  // Close form modal
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHall(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50 dark:bg-[#030712] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#030712]">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Halls</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            {halls.length} {halls.length === 1 ? "hall" : "halls"} configured in your cinema.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span>Add Hall</span>
        </button>
      </div>

      {/* Messages */}
      {(error || successMessage) && (
        <div className="mx-8 mt-6 space-y-2">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 text-sm rounded-r-xl flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              {successMessage}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          // Mobile: Stack layout
          <div className="h-full">
            {mobileView === "list" ? (
              <HallList
                halls={halls}
                selectedHall={selectedHall}
                onSelectHall={handleSelectHall}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                isMobile={true}
              />
            ) : (
              <HallDetailPanel
                hall={selectedHall}
                onEdit={handleEditClick}
                onDelete={openDeleteConfirm}
                onToggleStatus={handleToggleStatus}
                isUpdating={isUpdating}
                isMobile={true}
                onBackToList={() => setMobileView("list")}
              />
            )}
          </div>
        ) : (
          // Desktop: Two-column layout
          <div className="h-full flex px-8 py-6 gap-6">
            {/* Left Column: Hall List */}
            <div className="w-96 flex flex-col overflow-hidden bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <HallList
                halls={halls}
                selectedHall={selectedHall}
                onSelectHall={handleSelectHall}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
              />
            </div>

            {/* Right Column: Detail Panel */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <HallDetailPanel
                hall={selectedHall}
                onEdit={handleEditClick}
                onDelete={openDeleteConfirm}
                onToggleStatus={handleToggleStatus}
                isUpdating={isUpdating}
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <HallForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingHall ? handleUpdateHall : handleCreateHall}
        hall={editingHall}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <HallDeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setHallToDelete(null);
        }}
        onConfirm={handleDeleteHall}
        hall={hallToDelete}
        isLoading={isUpdating}
      />
    </div>
  );
}
