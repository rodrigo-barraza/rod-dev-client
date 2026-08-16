import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import StyleCollection from "@/collections/StyleCollection";
import SamplerCollection from "@/collections/SamplerCollection";
import AspectRatioCollection from "@/collections/AspectRatioCollection";

import RenderApiLibrary from "@/libraries/RenderApiLibrary";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import SelectComponent from "@/components//SelectComponent/SelectComponent";
import SliderComponent from "@/components//SliderComponent/SliderComponent";
import ButtonComponent from "@/components//ButtonComponent/ButtonComponent";
import BadgeComponent from "@/components//BadgeComponent/BadgeComponent";
import TextAreaComponent from "@/components//TextAreaComponent/TextAreaComponent";
import LikeComponent from "@/components//LikeComponent/LikeComponent";
import { useAlertContext } from "@/contexts/AlertContext";
import styles from "./Txt2ImageComponent.module.scss";
import { useApplicationState } from "@/stores/ZustandStore";
import type { Txt2ImageComponentProps, Render } from "@/types/types";

export default function Txt2ImageComponent({
  render,
  setGuest,
}: Txt2ImageComponentProps) {
  const router = useRouter();
  const currentPage = usePathname();
  const [image, setImage] = useState(
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  );
  const [newPrompt, setNewPrompt] = useState("");
  const [sampler, setSampler] = useState(SamplerCollection[0].value);
  const [newStyle, setNewStyle] = useState("");
  const [config, setCfg] = useState(7);
  const [date, setDate] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [generatedImageTitle, setGeneratedImageTitle] =
    useState("Generated Image #");
  const [generatedImageDescription, setGeneratedImageDescription] =
    useState("");
  const [, setGeneratedImageSampler] = useState("");
  const [, setGeneratedImageStyle] = useState("");
  const [generatedImageId, setGeneratedImageId] = useState("");
  const [, setStyleLabelColor] = useState("black");
  const [, setLike] = useState(render.like);
  const [, setLikes] = useState(render.likes);
  const [theRender, setTheRender] = useState<Render>(render);
  const formReference = useRef<HTMLFormElement>(null);
  const [aspectRatio, setAspectRatio] = useState(
    AspectRatioCollection[0].value,
  );
  const { isRenderApiAvailable } = useApplicationState();

  const { setMessage } = useAlertContext();

  const renderImage = useCallback(() => {
    setIsImageLoading(true);
    RenderApiLibrary.postRender(
      newPrompt,
      sampler,
      config,
      newStyle,
      "",
      aspectRatio,
    )
      .then((parsedResult) => {
        const samplerLabel = UtilityLibrary.findSamplerLabel(
          parsedResult.data.sampler,
        );
        const styleLabel = UtilityLibrary.findStyleLabel(
          parsedResult.data.style,
        );
        const currentStyle = UtilityLibrary.findStyle(parsedResult.data.style);

        router.push(`${currentPage}?id=${parsedResult.data.id}`);

        setTheRender(parsedResult.data as unknown as Render);

        setStyleLabelColor(currentStyle?.color ?? "black");
        setGeneratedImageId(parsedResult.data.id);
        setGeneratedImageTitle(`Generated Image #${parsedResult.data.count}`);
        setGeneratedImageDescription(newPrompt);
        setDate(
          UtilityLibrary.toHumanDateAndTime(parsedResult.data.createdAt) ?? "",
        );
        setGeneratedImageSampler(samplerLabel ?? "");
        setGeneratedImageStyle(styleLabel ?? "");

        const image = new window.Image();
        image.onload = function () {
          setImage(parsedResult.data.image ?? "");
          setIsImageLoading(false);
        };
        image.src = parsedResult.data.image ?? "";
      })
      .catch((error) => console.error("error", error));
  }, [newStyle, newPrompt, sampler, config, aspectRatio]);

  useEffect(() => {
    async function getRender() {
      if (render) {
        const samplerLabel = UtilityLibrary.findSamplerLabel(render.sampler);
        const currentStyle = UtilityLibrary.findStyle(render.style);
        const styleLabel = UtilityLibrary.findStyleLabel(render.style);

        setTheRender(render);

        setSampler(render.sampler);
        setNewStyle(render.style);
        setCfg(render.config);
        setNewPrompt(render.prompt);

        if (render.aspectRatio) setAspectRatio(render.aspectRatio);
        else setAspectRatio(AspectRatioCollection[0].value);

        setStyleLabelColor(currentStyle?.color ?? "black");
        setGeneratedImageId(render.id);
        setGeneratedImageTitle(`Generated Image #${render.count}`);
        setGeneratedImageDescription(render.prompt);
        setDate(UtilityLibrary.toHumanDateAndTime(render.createdAt) ?? "");
        setGeneratedImageSampler(samplerLabel ?? "");
        setGeneratedImageStyle(styleLabel ?? "");

        setImage(render.image);
        setIsImageLoading(false);
      }
    }
    getRender();
  }, [render]);

  function onTextAreaComponentChange(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.keyCode == 13 && event.shiftKey == false) {
      submitForm(event);
    }
  }

  function submitForm(event: React.FormEvent | React.KeyboardEvent) {
    event.preventDefault();
    renderImage();
  }

  function downloadGeneration() {
    UtilityLibrary.downloadImage(image, generatedImageTitle);
  }

  async function fetchRender(id: string) {
    const result = await RenderApiLibrary.getRender(id);
    const renderData = result.data;
    if (renderData) {
      setLike(renderData.like);
      setLikes(renderData.likes);
      setTheRender(renderData);
    }
  }

  function shareGeneration() {
    setMessage("Copied Link!");
    UtilityLibrary.shareLink(generatedImageId);

    const timeoutTimer = setTimeout(function () {
      setMessage("");
      clearTimeout(timeoutTimer);
    }, 1000);
  }

  return (
    <div
      className={`${styles.Txt2ImageComponent} ${render.aspectRatio == "square" ? styles.square : render.aspectRatio == "landscape" ? styles.landscape : styles.portrait}`}
    >
      <div
        className={`Card Interface ${!isRenderApiAvailable ? "disabled" : ""}`}
      >
        <h1>Generate an image from text</h1>
        <p>
          Try out Rodrigo Barraza&apos;s text-to-image realism-model, trained on
          more than 120,000 images, photographs and captions.
        </p>

        <form onSubmit={(event) => submitForm(event)} ref={formReference}>
          <TextAreaComponent
            // disabled="true"
            label="Prompt"
            value={newPrompt}
            onChange={setNewPrompt}
            onKeyDown={onTextAreaComponentChange}
          ></TextAreaComponent>
          {/* <InputComponent 
                    label="Prompt"
                    type="text"
                    value={newPrompt} 
                    onChange={setNewPrompt}
                    ></InputComponent> */}
          <SelectComponent
            // disabled="true"
            label="Style"
            value={newStyle}
            options={StyleCollection}
            onChange={setNewStyle}
          ></SelectComponent>
          <SliderComponent
            // disabled="true"
            label="Strength"
            value={config}
            onChange={setCfg}
          ></SliderComponent>
          <SelectComponent
            // disabled="true"
            label="Aesthetic"
            value={sampler}
            options={SamplerCollection}
            onChange={setSampler}
          ></SelectComponent>
          <SelectComponent
            // disabled="true"
            label="Aspect Ratio"
            value={aspectRatio}
            options={AspectRatioCollection}
            onChange={setAspectRatio}
          ></SelectComponent>
          <ButtonComponent
            label="Generate"
            type="submit"
            className="filled blue"
            disabled={!newPrompt || isImageLoading}
            // disabled="true"
          ></ButtonComponent>
        </form>
      </div>
      <div
        className={`RenderCardComponent ${image && !isImageLoading ? "" : " loading"}`}
      >
        <h1 className="title">{render.id}</h1>
        <p className="date">{date}</p>
        <p className="description">{generatedImageDescription}</p>
        <div className="badges">
          <BadgeComponent type="sampler" value={render.sampler} />
          <BadgeComponent type="style" value={render.style} />
        </div>
        <div className="actions">
          {/* <ButtonComponent 
                    className=""
                    label="Buy"
                    disabled
                    type="button" 
                    ></ButtonComponent> */}
        </div>
        <div className="super-actions">
          <LikeComponent
            type="like"
            render={theRender}
            setFunction={fetchRender}
            setGuest={setGuest}
          ></LikeComponent>
          <LikeComponent
            type="favorite"
            render={theRender}
            setFunction={fetchRender}
            setGuest={setGuest}
          ></LikeComponent>
        </div>
        <div className="super-actions2">
          <ButtonComponent
            className="mini"
            type="action"
            onClick={shareGeneration}
            icon="forward"
          ></ButtonComponent>
          <ButtonComponent
            className="mini"
            type="action"
            onClick={downloadGeneration}
            icon="download"
          ></ButtonComponent>
        </div>
      </div>
      <picture
        className={`RenderPictureComponent image ${isImageLoading ? "loading" : ""}`}
      >
        <img
          className={`${isImageLoading ? "loading" : ""}`}
          src={image}
          alt={newPrompt}
        />
      </picture>
    </div>
  );
}
