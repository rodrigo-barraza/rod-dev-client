"use client";

import React, { useState, useEffect } from "react";
import Txt2ImageComponent from "@/components/Txt2ImageComponent/Txt2ImageComponent";
import style from "./index.module.scss";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";
import GenerateHeaderComponent from "@/components/GenerateHeaderComponent/GenerateHeaderComponent";
import GalleryComponent from "@/components/GalleryComponent/GalleryComponent";
import PaginationComponent from "@/components/PaginationComponent/PaginationComponent";
import useGuest from "@/hooks/useGuest";
import type { Render, Guest } from "@/types/types";

interface ClientGenerateProps {
  render: Render;
  randomRenders: Render[];
  guest?: Guest;
}

export default function ClientGenerate({
  render,
  randomRenders,
  guest,
}: ClientGenerateProps) {
  const [exploreRenders] = useState<Render[]>(randomRenders);
  const [renders, setRenders] = useState<Render[]>([]);
  const [renderCount, setRenderCount] = useState(0);
  const { guestData, setGuestData, refreshGuest } = useGuest(guest);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  async function getCount() {
    const count = await RenderApiLibrary.getCount();
    setRenderCount(count.data.count);
  }

  async function getRenders() {
    const result = await RenderApiLibrary.getRenders("1", "user");
    setRenders(result.data.images);
  }

  useEffect(() => {
    refreshGuest();
    getCount();
    getRenders();
  }, [render]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const filteredCurrentRenders = exploreRenders;
  const filteredCurrentRendersList = filteredCurrentRenders?.slice(
    indexOfFirstPost,
    indexOfLastPost,
  );
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <main className={style.GeneratePage}>
      <GenerateHeaderComponent guest={guestData} renders={renders} />
      <Txt2ImageComponent render={render} setGuest={setGuestData} />
      <div className="gallery">
        <div className="sectionTitle">
          <div>Explore {renderCount} Renders</div>
        </div>

        <PaginationComponent
          postsPerPage={postsPerPage}
          totalPosts={filteredCurrentRenders?.length ?? 0}
          paginate={paginate}
          currentPage={currentPage}
        />
        <GalleryComponent
          renders={filteredCurrentRendersList ?? []}
          mode="grid"
        />
      </div>
    </main>
  );
}
