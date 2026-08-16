"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import style from "./index.module.scss";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";
import GenerateHeaderComponent from "@/components/GenerateHeaderComponent/GenerateHeaderComponent";
import PaginationComponent from "@/components/PaginationComponent/PaginationComponent";
import GalleryComponent from "@/components/GalleryComponent/GalleryComponent";
import FilterComponent from "@/components/FilterComponent/FilterComponent";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import useFilteredPagination from "@/hooks/useFilteredPagination";
import useGuest from "@/hooks/useGuest";
import type { Render, Guest } from "@/types/types";

interface LikesPageProps {
  guest?: Guest;
}

export default function Likes({ guest }: LikesPageProps = {}) {
  const router = useRouter();
  const [likedRenders, setLikedRenders] = useState<Render[]>([]);
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
  } = useFilteredPagination(likedRenders);

  async function getRenders() {
    const result = await RenderApiLibrary.getRenders("12", "user");
    setCurrentRenders(result.data.images);
  }

  useEffect(() => {
    getRenders();
  }, []);

  async function getLikedRenders() {
    const result = await RenderApiLibrary.getLikedRenders();
    setLikedRenders(result.data.images);
    if (!result.data.images.length) {
      UtilityLibrary.navigateToGeneration(router);
    }
  }

  useEffect(() => {
    getLikedRenders();
  }, []);

  return (
    <main className={style.RendersPage}>
      <GenerateHeaderComponent guest={guestData} renders={currentRenders} />
      <div className="gallery">
        <div className="details">
          <div className="container column">
            <h1>Your Likes</h1>
            <p>text-to-image AI generations</p>
            <p>A collection of liked AI-generated images</p>
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
          getRenders={getLikedRenders}
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
