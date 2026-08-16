"use client";

import React from "react";
import style from "./GalleryComponent.module.scss";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import BadgeComponent from "../BadgeComponent/BadgeComponent";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import LikeComponent from "../LikeComponent/LikeComponent";
import { useAlertContext } from "@/contexts/AlertContext";
import type { GalleryComponentProps, Render } from "@/types/types";

export default function GalleryComponent({
  renders,
  getRenders,
  mode,
}: GalleryComponentProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const { setMessage } = useAlertContext();

  async function deleteRender(id: string) {
    const deleteResult = await RenderApiLibrary.deleteRender(id);
    if (deleteResult.data?.success) {
      getRenders?.();
    }
  }

  async function startDeleteRender(id: string) {
    const deleteObject = { ...isDeleting };
    deleteObject[id] = true;
    setIsDeleting(deleteObject);
  }

  async function cancelDeleteRender(id: string) {
    const deleteObject = { ...isDeleting };
    deleteObject[id] = false;
    setIsDeleting(deleteObject);
  }

  function downloadGeneration(generation: Render) {
    UtilityLibrary.downloadImage(generation.image, generation.id);
  }

  function shareGeneration(generation: Render) {
    setMessage("Copied Link!");
    UtilityLibrary.shareLink(generation.id);

    const timeoutTimer = setTimeout(function () {
      setMessage("");
      clearTimeout(timeoutTimer);
    }, 1000);
  }

  return (
    <div className={`${style.GalleryComponent} ${style[mode]}`}>
      {renders?.map((render: Render, index: number) => (
        <div key={index} className="item">
          <div className="container">
            <picture className="RenderPictureComponent image">
              {mode == "grid" && (
                <img
                  className="thumbnail"
                  onClick={() =>
                    UtilityLibrary.navigateToGeneration(router, render.id)
                  }
                  src={render.thumbnail || render.image}
                  alt={render.prompt}
                ></img>
              )}
              {mode == "list" && (
                <img
                  className="image"
                  src={render.image}
                  alt={render.prompt}
                ></img>
              )}
            </picture>
            {mode == "list" && (
              <div className="RenderCardComponent">
                {isDeleting[render.id] && (
                  <div className="overlay">
                    <div className="message">
                      Are you sure you want to delete this?
                    </div>
                    <div className="actions">
                      <ButtonComponent
                        className="mini "
                        label="Cancel"
                        type="button"
                        onClick={() => cancelDeleteRender(render.id)}
                      ></ButtonComponent>
                      <ButtonComponent
                        className="mini red"
                        label="Delete"
                        type="button"
                        onClick={() => deleteRender(render.id)}
                      ></ButtonComponent>
                    </div>
                  </div>
                )}
                <div className="title">{render.id}</div>
                <div className="date">
                  {UtilityLibrary.toHumanDateAndTime(render.createdAt)}
                </div>
                <div className="description">{render.prompt}</div>
                <div className="badges">
                  <BadgeComponent type="sampler" value={render.sampler} />
                  <BadgeComponent type="style" value={render.style} />
                </div>
                <div className="actions">
                  <ButtonComponent
                    className="mini"
                    label="Load"
                    type="button"
                    onClick={() =>
                      UtilityLibrary.navigateToGeneration(router, render.id)
                    }
                  ></ButtonComponent>
                  {render.isCreator && (
                    <ButtonComponent
                      className="mini red"
                      label="Delete"
                      type="button"
                      disabled={isDeleting[render.id]}
                      onClick={() => startDeleteRender(render.id)}
                    ></ButtonComponent>
                  )}
                </div>
                <div className="super-actions">
                  <LikeComponent
                    type="like"
                    render={render}
                    setFunction={() => getRenders?.()}
                  ></LikeComponent>
                  <LikeComponent
                    type="favorite"
                    render={render}
                    setFunction={() => getRenders?.()}
                  ></LikeComponent>
                </div>
                <div className="super-actions2">
                  <ButtonComponent
                    className="mini"
                    type="action"
                    onClick={() => shareGeneration(render)}
                    icon="forward"
                  ></ButtonComponent>
                  <ButtonComponent
                    className="mini"
                    type="action"
                    onClick={() => downloadGeneration(render)}
                    icon="download"
                  ></ButtonComponent>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
