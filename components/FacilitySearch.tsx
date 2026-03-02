"use client";

import { useState } from "react";
import { saveTaskData } from "@/lib/utils/taskData";
import type { FacilityResult } from "@/lib/facilities/cmsApi";

interface FacilitySearchProps {
  parentState?: string;
  parentCity?: string;
  parentZip?: string;
}

function StarRating({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-sans text-[10px] text-slateMid">{label}</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`text-xs ${i <= rating ? "text-amber" : "text-sandDark"}`}
          >
            &#9733;
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FacilitySearch({
  parentState,
  parentCity,
  parentZip,
}: FacilitySearchProps) {
  const [facilities, setFacilities] = useState<FacilityResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Filters
  const [radius, setRadius] = useState(25);
  const [minRating, setMinRating] = useState(1);
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  const canSearch = !!parentState;

  const handleSearch = async () => {
    if (!parentState) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams({
        state: parentState,
        radius: String(radius),
        minRating: String(minRating),
        limit: "30",
      });
      if (parentZip) params.set("zip", parentZip);

      const res = await fetch(`/api/facility-search?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Search failed");
      }

      const data = await res.json();
      setFacilities(data.facilities || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (facility: FacilityResult) => {
    saveTaskData("Housing plan", "save_facility_shortlist", {
      name: facility.name,
      address: facility.address,
      city: facility.city,
      state: facility.state,
      zip: facility.zip,
      phone: facility.phone,
      overallRating: facility.overallRating,
      beds: facility.beds,
      distance: facility.distance,
    });
    setSavedIds((prev) => new Set(prev).add(facility.name));
  };

  const sortedFacilities =
    sortBy === "rating"
      ? [...facilities].sort((a, b) => b.overallRating - a.overallRating)
      : facilities; // already sorted by distance from API

  return (
    <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
      <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
        Nearby Nursing Homes
      </div>
      <p className="font-sans text-xs text-slateMid mb-3">
        Search Medicare-rated nursing homes near{" "}
        {parentCity && parentState
          ? `${parentCity}, ${parentState}`
          : parentState || "your parent"}
        . Data from CMS Care Compare.
      </p>

      {!canSearch && (
        <p className="font-sans text-xs text-coral">
          Add your parent&apos;s state in their profile to enable facility search.
        </p>
      )}

      {canSearch && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-3">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="rounded-[8px] border border-sandDark px-2 py-1.5 font-sans text-xs text-slate bg-white"
            >
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
            </select>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-[8px] border border-sandDark px-2 py-1.5 font-sans text-xs text-slate bg-white"
            >
              <option value={1}>Any rating</option>
              <option value={3}>3+ stars</option>
              <option value={4}>4+ stars</option>
            </select>
            {searched && facilities.length > 0 && (
              <button
                onClick={() =>
                  setSortBy((s) => (s === "distance" ? "rating" : "distance"))
                }
                className="rounded-[8px] border border-sandDark px-2 py-1.5 font-sans text-xs text-slate bg-white hover:bg-sand/30 transition-colors"
              >
                Sort: {sortBy === "distance" ? "Distance" : "Rating"}
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full rounded-[12px] px-4 py-3 bg-ocean text-white font-sans text-sm font-semibold text-center hover:bg-ocean/90 transition-colors disabled:opacity-50 mb-3"
          >
            {loading ? "Searching..." : "Search Nearby"}
          </button>
        </>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[10px] border border-sandDark px-4 py-3 animate-pulse"
            >
              <div className="h-4 bg-sand rounded w-3/4 mb-2" />
              <div className="h-3 bg-sand rounded w-1/2 mb-2" />
              <div className="h-3 bg-sand rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="font-sans text-sm text-coral">{error}</p>
      )}

      {/* No results */}
      {searched && !loading && !error && facilities.length === 0 && (
        <div className="rounded-[10px] border border-sandDark px-4 py-4 text-center">
          <p className="font-sans text-sm text-slate mb-1">
            No facilities found
          </p>
          <p className="font-sans text-xs text-slateMid">
            Try increasing the search radius or lowering the minimum rating.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && sortedFacilities.length > 0 && (
        <>
          <p className="font-sans text-xs text-slateMid mb-2">
            Showing {sortedFacilities.length} of {total} facilities
          </p>
          <div className="flex flex-col gap-3">
            {sortedFacilities.map((f) => (
              <div
                key={`${f.name}-${f.address}`}
                className="rounded-[10px] border border-sandDark px-4 py-3"
              >
                <div className="font-sans text-sm font-semibold text-slate">
                  {f.name}
                </div>
                <div className="font-sans text-xs text-slateMid mt-0.5">
                  {f.address}, {f.city}, {f.state} {f.zip}
                  {f.distance > 0 && (
                    <span className="ml-1 font-medium text-ocean">
                      &middot; {f.distance} mi
                    </span>
                  )}
                </div>

                {/* Star ratings */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  <StarRating rating={f.overallRating} label="Overall" />
                  <StarRating rating={f.healthInspectionRating} label="Health" />
                  <StarRating rating={f.staffingRating} label="Staff" />
                  <StarRating rating={f.qmRating} label="Quality" />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {f.beds > 0 && (
                    <span className="inline-block rounded-full bg-sand px-2 py-0.5 font-sans text-[10px] text-slate">
                      {f.beds} beds
                    </span>
                  )}
                  {f.providerType && (
                    <span className="inline-block rounded-full bg-sand px-2 py-0.5 font-sans text-[10px] text-slate">
                      {f.providerType}
                    </span>
                  )}
                </div>

                {/* Red flags */}
                {(f.hasAbuseIcon || f.totalFines > 50000) && (
                  <div className="flex flex-col gap-0.5 mt-2">
                    {f.hasAbuseIcon && (
                      <span className="font-sans text-[11px] text-coral font-medium">
                        &#9888; Abuse citation on record
                      </span>
                    )}
                    {f.totalFines > 50000 && (
                      <span className="font-sans text-[11px] text-coral font-medium">
                        &#9888; ${(f.totalFines / 1000).toFixed(0)}K+ in fines
                      </span>
                    )}
                  </div>
                )}

                {/* Phone + Save */}
                <div className="flex items-center justify-between mt-2">
                  {f.phone && (
                    <a
                      href={`tel:${f.phone.replace(/\D/g, "")}`}
                      className="font-sans text-xs text-ocean hover:underline"
                    >
                      {f.phone}
                    </a>
                  )}
                  {savedIds.has(f.name) ? (
                    <span className="font-sans text-xs text-sage font-medium">
                      Saved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSave(f)}
                      className="font-sans text-xs text-ocean hover:underline font-medium"
                    >
                      Save to Shortlist
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
