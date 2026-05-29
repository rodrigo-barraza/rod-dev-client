"use client";

import { useEffect, useState } from "react";
import {
  ThemeProvider,
  SessionTrackerComponent,
} from "@rodrigo-barraza/components-library";
import { AlertProvider, useAlertContext } from "@/contexts/AlertContext";
import LayoutComponent from "@/components/LayoutComponent";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";
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
  const [getRenderStatus, setRenderStatus] = useState(false);
  const { setIsRenderApiAvailable } = useApplicationState();

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
    } catch (error) {
      setRenderStatus(false);
      setIsRenderApiAvailable(false);
    }
  }

  useEffect(() => {
    getStatus();
  }, []);

  return (
    <ThemeProvider>
      <SessionTrackerComponent projectId={PROJECT_NAME} />
      <LayoutComponent>
        <AlertProvider>
          <AlertMessageHelper />
          {children}
        </AlertProvider>
      </LayoutComponent>
    </ThemeProvider>
  );
}
