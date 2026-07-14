import { redirect } from "next/navigation";
import type { Metadata } from "next";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";
import GuestApiLibrary from "@/libraries/GuestApiLibrary";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import { headers } from "next/headers";
import { IDENTITY_HEADERS } from "@rodrigo-barraza/utilities-library/taxonomy";
import ClientGenerate from "./ClientGenerate";
import type { Render, Guest } from "@/types/types";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  let render: Render | undefined;

  if (params?.id) {
    const getRender = await RenderApiLibrary.getRender(params.id as string);
    if (getRender?.data) {
      render = getRender.data;
    }
  }

  return {
    title: "Rodrigo Barraza - Text to Image: AI Image Generation",
    description:
      "Try out Rodrigo Barraza's text-to-image AI image generation realism-model, trained on more than 120,000 images, photographs and captions.",
    keywords:
      "generate, text, text to image, text to image generator, text to image ai, ai image, rodrigo barraza",
    openGraph: {
      images: [
        render?.image
          ? render.image
          : "https://assets.rod.dev/rod-dev-generations/2f996be4-b935-42db-9d1e-01effabbc5c6.jpg",
      ],
    },
  };
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  let render: Render = {} as Render;
  let randomRenders: Render[] = [];
  let guest: Guest | undefined = undefined;

  const getRenders = await RenderApiLibrary.getRenders("240");
  randomRenders = getRenders?.data?.images ?? [];

  if (params?.id) {
    const getRender = await RenderApiLibrary.getRender(params.id as string);
    if (getRender?.data) {
      render = getRender.data;
    } else {
      redirect("/generate");
    }
  } else {
    const getRender = await RenderApiLibrary.getRender();
    render = getRender?.data ?? ({} as Render);
  }

  // Attempt to get guest
  const headersList = await headers();
  const forwardedFor = headersList.get(IDENTITY_HEADERS.forwardedFor);
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1";

  try {
    const getGuest = await GuestApiLibrary.getGuest(ip);
    if (getGuest.data) {
      guest = getGuest.data;
    }
  } catch (e) {}

  return (
    <ClientGenerate
      render={render}
      randomRenders={randomRenders}
      guest={guest}
    />
  );
}
