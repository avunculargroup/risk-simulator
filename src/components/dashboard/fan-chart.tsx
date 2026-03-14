"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import type { PercentileBands } from "@/engine/types";
import { formatUSD } from "@/lib/utils";

interface FanChartProps {
  bands: PercentileBands;
  currentPrice: number;
  height?: number;
  horizon?: number;
}

interface TooltipData {
  x: number;
  y: number;
  date: Date;
  median: number;
  p5: number;
  p95: number;
}

export function FanChart({ bands, currentPrice, height = 320, horizon }: FanChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !bands?.timestamps?.length) return;

    const margin = { top: 16, right: 16, bottom: 32, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Get CSS custom property values
    const style = getComputedStyle(document.documentElement);
    const gold = style.getPropertyValue("--color-gold").trim() || "#C9A84C";
    const border = style.getPropertyValue("--color-border").trim() || "#E8E6E0";
    const tertiary = style.getPropertyValue("--color-text-tertiary").trim() || "#9E9C96";
    const secondary = style.getPropertyValue("--color-text-secondary").trim() || "#6B6860";

    const timestamps = bands.timestamps.map(t => new Date(t));
    const xScale = d3.scaleTime()
      .domain([timestamps[0], timestamps[timestamps.length - 1]])
      .range([0, innerWidth]);

    const allValues = [...bands.p1, ...bands.p99].filter(v => v > 0);
    const yMin = d3.min(allValues) ?? 0;
    const yMax = d3.max(allValues) ?? currentPrice * 2;
    const yScale = d3.scaleLinear()
      .domain([yMin * 0.95, yMax * 1.05])
      .range([innerHeight, 0]);

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    const yTicks = yScale.ticks(5);
    g.selectAll(".grid-line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", border)
      .attr("stroke-dasharray", "3 3")
      .attr("stroke-width", 1);

    // Fan bands (outer to inner)
    const fanLayers: Array<[keyof PercentileBands, keyof PercentileBands, string]> = [
      ["p5", "p95", "0.05"],
      ["p10", "p90", "0.08"],
      ["p25", "p75", "0.14"],
    ];

    for (const [lower, upper, opacity] of fanLayers) {
      const areaGen = d3.area<number>()
        .x((_, i) => xScale(timestamps[i]))
        .y0(d => yScale(bands[lower][d] ?? d))
        .y1(d => yScale(bands[upper][d] ?? d));

      // Build index array since d3 area needs index
      const indices = bands.timestamps.map((_, i) => i);
      const areaGenFinal = d3.area<number>()
        .x(i => xScale(timestamps[i]))
        .y0(i => yScale(bands[lower][i] ?? 0))
        .y1(i => yScale(bands[upper][i] ?? 0));

      g.append("path")
        .datum(indices)
        .attr("fill", gold)
        .attr("fill-opacity", opacity)
        .attr("d", areaGenFinal);
    }

    // Median line
    const medianLine = d3.line<number>()
      .x(i => xScale(timestamps[i]))
      .y(i => yScale(bands.p50[i] ?? 0));

    const indices = bands.timestamps.map((_, i) => i);
    g.append("path")
      .datum(indices)
      .attr("fill", "none")
      .attr("stroke", gold)
      .attr("stroke-width", 2.5)
      .attr("d", medianLine);

    // Current price reference line
    if (currentPrice >= yMin && currentPrice <= yMax) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(currentPrice))
        .attr("y2", yScale(currentPrice))
        .attr("stroke", tertiary)
        .attr("stroke-dasharray", "4 4")
        .attr("stroke-width", 1);
    }

    // X axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => {
        const date = d as Date;
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }))
      .call(ax => {
        ax.select(".domain").remove();
        ax.selectAll(".tick line").attr("stroke", border);
        ax.selectAll(".tick text")
          .attr("fill", secondary)
          .style("font-family", "'JetBrains Mono', monospace")
          .style("font-size", "11px");
      });

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => {
        const v = d as number;
        if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
        return `$${v.toFixed(0)}`;
      }))
      .call(ax => {
        ax.select(".domain").remove();
        ax.selectAll(".tick line").remove();
        ax.selectAll(".tick text")
          .attr("fill", secondary)
          .style("font-family", "'JetBrains Mono', monospace")
          .style("font-size", "11px");
      });

    // Tooltip interaction overlay
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const date = xScale.invert(mx);
        const i = d3.bisectLeft(timestamps, date);
        const idx = Math.max(0, Math.min(i, timestamps.length - 1));

        const containerRect = svgRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        setTooltip({
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top,
          date: timestamps[idx],
          median: bands.p50[idx] ?? 0,
          p5: bands.p5[idx] ?? 0,
          p95: bands.p95[idx] ?? 0,
        });
      })
      .on("mouseleave", () => setTooltip(null));
  }, [bands, currentPrice, height, width]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-bts-surface border border-bts-border p-3 shadow-bts-md text-body-sm"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 60,
            transform: tooltip.x > width - 180 ? "translateX(-100%)" : undefined,
          }}
        >
          <p className="font-sans text-caption text-bts-secondary mb-1">
            {tooltip.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
          <p className="font-mono text-data-sm text-bts-primary">
            Median: {formatUSD(tooltip.median)}
          </p>
          <p className="font-mono text-data-sm text-bts-tertiary">
            5th–95th: {formatUSD(tooltip.p5)} – {formatUSD(tooltip.p95)}
          </p>
        </div>
      )}
    </div>
  );
}
