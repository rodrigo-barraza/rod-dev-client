"use client";

import { useEffect, useState } from "react";
import {
  ThemeProvider,
  SessionTrackerComponent,
} from "@rodrigo-barraza/components-library";
import { AlertProvider, useAlertContext } from "@/contexts/AlertContext";
import LayoutComponent from "@/components/LayoutComponent";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";
import WebGpuLibrary from "@/libraries/WebGpuLibrary";
import { useApplicationState } from "@/stores/ZustandStore";
import { PROJECT_NAME } from "@/config";

function AlertMessageHelper() {
  const { message } = useAlertContext();
  return <>{message}</>;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [, setRenderStatus] = useState(false);
  const { setIsRenderApiAvailable, setIsWebGpuSupported } =
    useApplicationState();

  async function getStatus() {
    try {
      const getStatus = await RenderApiLibrary.getStatus();
      if (getStatus.data) {
        setRenderStatus(true);
        setIsRenderApiAvailable(true);
      } else {
        setRenderStatus(false);
        setIsRenderApiAvailable(false);
      }
    } catch {
      setRenderStatus(false);
      setIsRenderApiAvailable(false);
    }
  }

  // One adapter probe per page load, so anything that wants to branch on
  // WebGPU support can read it off the store instead of asking the driver
  // again. It requests an adapter, never a device: no GPU memory is taken
  // and nothing is rendered.
  async function getWebGpuSupport() {
    setIsWebGpuSupported(await WebGpuLibrary.probeSupport());
  }

  useEffect(() => {
    getStatus();
    getWebGpuSupport();
  }, []);

  return (
    <ThemeProvider>
      <SessionTrackerComponent projectId={PROJECT_NAME} replay heatmap />
      <LayoutComponent>
        <AlertProvider>
          <AlertMessageHelper />
          {children}
        </AlertProvider>
      </LayoutComponent>
    </ThemeProvider>
  );
}
