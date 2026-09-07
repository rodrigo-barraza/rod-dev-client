"use client";

import React, { useState } from "react";
import style from "./index.module.scss";
import WebGpuCanvasComponent from "@/components/WebGpuCanvasComponent/WebGpuCanvasComponent";
import type { WebGpuFailure, WebGpuSession } from "@/types/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Checking…",
  ready: "Device acquired",
  unavailable: "Unavailable",
};

/**
 * The surface WebGPU support is developed against.
 *
 * It mounts a real device against a real canvas and reports what came back
 * — adapter identity, features, limits, the preferred canvas format — while
 * drawing nothing at all. When there is something to render, it goes in the
 * canvas below through `onSessionReady` / `onFrame`; until then this page
 * answers the only question worth asking first, which is what this machine
 * will let us do.
 */
export default function ClientWebGpu() {
  const [session, setSession] = useState<WebGpuSession | null>(null);
  const [failure, setFailure] = useState<WebGpuFailure | null>(null);

  const report = session?.report;
  const status = session ? "ready" : failure ? "unavailable" : "pending";

  const adapterName =
    [report?.vendor, report?.architecture, report?.device]
      .filter(Boolean)
      .join(" · ") ||
    report?.description ||
    // Browsers redact adapter strings unless the page asked for and was
    // granted the unmasked info, so an empty report is the common case
    // rather than a failure.
    "Reported anonymously by the browser";

  return (
    <div className={style.WebGpuPage}>
      <header className={style.header}>
        <h1 className={style.title}>WebGPU</h1>
        <p className={style.subtitle}>
          Device, canvas and frame-loop support are wired up. Nothing is
          rendered yet — the canvas below holds a live, configured device that
          has been asked to draw nothing.
        </p>
        <span className={`${style.status} ${style[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </header>

      <section className={style.section}>
        <h2 className={style.sectionTitle}>Adapter</h2>
        <dl className={style.facts}>
          <div className={style.fact}>
            <dt>Identity</dt>
            <dd>{adapterName}</dd>
          </div>
          <div className={style.fact}>
            <dt>Canvas format</dt>
            <dd>{report?.preferredFormat ?? "—"}</dd>
          </div>
          <div className={style.fact}>
            <dt>Fallback adapter</dt>
            <dd>{report ? (report.isFallbackAdapter ? "yes" : "no") : "—"}</dd>
          </div>
          <div className={style.fact}>
            <dt>Generation</dt>
            <dd>{session ? session.generation : "—"}</dd>
          </div>
        </dl>
        {failure && <p className={style.failure}>{failure.message}</p>}
      </section>

      <section className={style.section}>
        <h2 className={style.sectionTitle}>
          Features {report ? `(${report.features.length})` : ""}
        </h2>
        {report?.features.length ? (
          <ul className={style.chips}>
            {report.features.map((feature) => (
              <li key={feature} className={style.chip}>
                {feature}
              </li>
            ))}
          </ul>
        ) : (
          <p className={style.empty}>
            {report
              ? "This adapter exposes no optional features."
              : "Waiting for a device."}
          </p>
        )}
      </section>

      <section className={style.section}>
        <h2 className={style.sectionTitle}>Limits</h2>
        {report && Object.keys(report.limits).length ? (
          <div className={style.limits}>
            {Object.entries(report.limits).map(([name, value]) => (
              <div key={name} className={style.limit}>
                <span className={style.limitName}>{name}</span>
                <span className={style.limitValue}>
                  {value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className={style.empty}>Waiting for a device.</p>
        )}
      </section>

      <section className={style.section}>
        <h2 className={style.sectionTitle}>Canvas</h2>
        <WebGpuCanvasComponent
          className={style.canvas}
          label="rod.dev diagnostics canvas"
          onSessionReady={setSession}
          onSessionEnd={() => setSession(null)}
          onFailure={setFailure}
        />
        <p className={style.note}>
          The device is live and the context is configured; no pass is encoded,
          so the canvas is transparent. Pass <code>onFrame</code> to{" "}
          <code>WebGpuCanvasComponent</code> to start a render loop.
        </p>
      </section>
    </div>
  );
}
