"use client";

import React from "react";
import { useState, useEffect } from "react";
import style from "./index.module.scss";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";
import GenerateHeaderComponent from "@/components/GenerateHeaderComponent/GenerateHeaderComponent";
import PaginationComponent from "@/components/PaginationComponent/PaginationComponent";
import GalleryComponent from "@/components/GalleryComponent/GalleryComponent";
import FilterComponent from "@/components/FilterComponent/FilterComponent";
import useFilteredPagination from "@/hooks/useFilteredPagination";
import useGuest from "@/hooks/useGuest";
import type { Render, Guest } from "@/types/types";

interface RendersPageProps {
  guest?: Guest;
}

export default function Renders({ guest }: RendersPageProps = {}) {
  const [currentRenders, setCurrentRenders] = useState<Render[]>([]);
  const { guestData, refreshGuest } = useGuest(guest);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    galleryMode,
    setGalleryMode,
    currentPage,
    postsPerPage,
    filteredItems: filteredCurrentRenders,
    paginatedItems: filteredCurrentRendersList,
    paginate,
  } = useFilteredPagination(currentRenders);

  async function getRenders() {
    const result = await RenderApiLibrary.getRenders("12", "user");
    setCurrentRenders(result.data.images);
  }

  useEffect(() => {
    getRenders();
  }, []);

  return (
    <main className={style.RendersPage}>
      <GenerateHeaderComponent guest={guestData} renders={currentRenders} />
      <div className="gallery">
        <div className="details">
          <div className="container column">
            <h1>Your Renders</h1>
            <p>text-to-image AI generations</p>
            <p>Your collection of AI-generated images</p>
          </div>
        </div>
        <FilterComponent
          setSearch={setSearch}
          setFilter={setFilter}
          setSort={setSort}
          setGalleryMode={setGalleryMode}
          search={search}
          filter={filter}
          sort={sort}
        />
        <PaginationComponent
          postsPerPage={postsPerPage}
          totalPosts={filteredCurrentRenders?.length ?? 0}
          paginate={paginate}
          currentPage={currentPage}
        />
        <GalleryComponent
          renders={filteredCurrentRendersList ?? []}
          getRenders={getRenders}
          getGuest={refreshGuest}
          mode={galleryMode as "grid" | "list"}
        />
        <PaginationComponent
          postsPerPage={postsPerPage}
          totalPosts={filteredCurrentRenders?.length ?? 0}
          paginate={paginate}
          currentPage={currentPage}
        />
      </div>
    </main>
  );
}
