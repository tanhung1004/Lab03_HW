
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CSSProperties } from "react";
import { mockSquads } from "../data/mockSquads";
import type { PubgVnSquadStanding } from "../types/arena";

/**
 * HW3-11 — Virtualized PUBG Leaderboard
 *
 * - Search and sort squads.
 * - Virtual rendering with fixed-height rows.
 * - Overscan for smoother scrolling.
 * - 1,000-row stress testing mode.
 * - No external virtualization library.
 */

type SortField =
  | "total"
  | "wwcd"
  | "placement"
  | "kills"
  | "name";

type SortDirection = "asc" | "desc";

const ROW_HEIGHT = 52;
const VIEWPORT_HEIGHT = 320;
const OVERSCAN = 5;

const GRID_COLUMNS =
  "58px minmax(220px, 1fr) repeat(4, 105px)";

const collator = new Intl.Collator("vi", {
  sensitivity: "base",
  numeric: true,
});

// Fictional data for performance testing only.
// 4 original squads + 996 generated squads = 1000.
const stressTestSquads: PubgVnSquadStanding[] =
  Array.from({ length: 996 }, (_, index) => {
    const number = index + 1;

    return {
      squadId: `demo-${number}`,
      squadName:
        `Demo Squad ${String(number).padStart(4, "0")}`,
      wwcdCount: (number * 7) % 6,
      placementPts: (number * 13) % 110,
      killPts: (number * 17) % 130,
    };
  });

function getTotal(
  squad: PubgVnSquadStanding
): number {
  return squad.placementPts + squad.killPts;
}

function getScore(
  squad: PubgVnSquadStanding,
  field: SortField
): number {
  switch (field) {
    case "total":
      return getTotal(squad);

    case "wwcd":
      return squad.wwcdCount;

    case "placement":
      return squad.placementPts;

    case "kills":
      return squad.killPts;

    case "name":
      return 0;
  }
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  color: "#f8fafc",
  background: "#0f172a",
  border: "1px solid #475569",
  borderRadius: 8,
};

const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: GRID_COLUMNS,
  alignItems: "center",
  height: ROW_HEIGHT,
  width: "100%",
  boxSizing: "border-box",
  borderBottom: "1px solid #334155",
};

const cellStyle: CSSProperties = {
  padding: "0 12px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export default function SquadLeaderboard() {
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] =
    useState<SortField>("total");

  const [direction, setDirection] =
    useState<SortDirection>("desc");

  const [stressMode, setStressMode] =
    useState(false);

  const [scrollTop, setScrollTop] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);

  // Derive filtered and sorted squad data.
  const visibleSquads = useMemo(() => {
    const source = stressMode
      ? [...mockSquads, ...stressTestSquads]
      : [...mockSquads];

    const keyword = search
      .trim()
      .toLocaleLowerCase("vi");

    const filtered = source.filter((squad) =>
      squad.squadName
        .toLocaleLowerCase("vi")
        .includes(keyword)
    );

    return filtered.sort((a, b) => {
      const comparison =
        sortBy === "name"
          ? collator.compare(
              a.squadName,
              b.squadName
            )
          : getScore(a, sortBy) -
            getScore(b, sortBy);

      const ordered =
        direction === "asc"
          ? comparison
          : -comparison;

      return (
        ordered ||
        collator.compare(
          a.squadName,
          b.squadName
        )
      );
    });
  }, [search, sortBy, direction, stressMode]);

  // Reset the scroll when filters or sort order change.
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }

    setScrollTop(0);
  }, [search, sortBy, direction, stressMode]);

  /**
   * Virtual scrolling:
   *
   * Only calculate rows that overlap the
   * visible viewport plus overscan.
   */
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN
  );

  const renderCount =
    Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) +
    OVERSCAN * 2;

  const endIndex = Math.min(
    visibleSquads.length,
    startIndex + renderCount
  );

  const renderedSquads = visibleSquads.slice(
    startIndex,
    endIndex
  );

  // Full virtual height maintains normal scrolling.
  const totalHeight =
    visibleSquads.length * ROW_HEIGHT;

  const viewportHeight = Math.min(
    VIEWPORT_HEIGHT,
    Math.max(ROW_HEIGHT, totalHeight)
  );

  const totalSourceCount = stressMode
    ? 1000
    : mockSquads.length;

  const headers = [
    "Rank",
    "Squad",
    "WWCD",
    "Placement",
    "Kills",
    "Total",
  ];

  return (
    <section
      className="arena-section"
      aria-labelledby="leaderboard-title"
    >
      <div className="section-heading">
        <div>
          <span className="section-tag">
            VIETNAM ESPORTS
          </span>

          <h2 id="leaderboard-title">
            Squad Leaderboard
          </h2>
        </div>

        <p>Virtualized standings</p>
      </div>

      <div className="leaderboard-panel">
        {/* Search and sort controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div>
            <label
              htmlFor="squad-search"
              style={{
                display: "block",
                marginBottom: 7,
              }}
            >
              Search Squad
            </label>

            <input
              id="squad-search"
              type="search"
              placeholder="Search squad name..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="squad-sort"
              style={{
                display: "block",
                marginBottom: 7,
              }}
            >
              Sort By
            </label>

            <select
              id="squad-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as SortField
                )
              }
              style={inputStyle}
            >
              <option value="total">
                Total Points
              </option>

              <option value="wwcd">
                WWCD
              </option>

              <option value="placement">
                Placement Points
              </option>

              <option value="kills">
                Kill Points
              </option>

              <option value="name">
                Squad Name
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="squad-direction"
              style={{
                display: "block",
                marginBottom: 7,
              }}
            >
              Order
            </label>

            <select
              id="squad-direction"
              value={direction}
              onChange={(event) =>
                setDirection(
                  event.target.value as SortDirection
                )
              }
              style={inputStyle}
            >
              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>
            </select>
          </div>
        </div>

        {/* Performance testing switch */}
        <label
          htmlFor="stress-mode"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            cursor: "pointer",
          }}
        >
          <input
            id="stress-mode"
            type="checkbox"
            checked={stressMode}
            onChange={(event) =>
              setStressMode(event.target.checked)
            }
          />

          Stress Test: 1,000 squads
        </label>

        <p
          role="status"
          aria-live="polite"
          style={{
            color: "#94a3b8",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          Showing {visibleSquads.length} of{" "}
          {totalSourceCount} squads · Rendering{" "}
          {renderedSquads.length} rows
        </p>

        {/* Horizontal scroll on narrow screens */}
        <div
          className="leaderboard-scroll"
          style={{ overflowX: "auto" }}
        >
          <div
            role="table"
            aria-label="Vietnam squad standings"
            aria-rowcount={visibleSquads.length + 1}
            style={{ minWidth: 760 }}
          >
            {/* Fixed header */}
            <div role="rowgroup">
              <div
                role="row"
                aria-rowindex={1}
                style={{
                  ...rowStyle,
                  background: "#0f172a",
                  color: "#cbd5e1",
                  fontWeight: 700,
                }}
              >
                {headers.map((header) => (
                  <div
                    key={header}
                    role="columnheader"
                    style={cellStyle}
                  >
                    {header}
                  </div>
                ))}
              </div>
            </div>

            {/* Vertically scrolling row viewport */}
            <div
              role="rowgroup"
              ref={viewportRef}
              tabIndex={0}
              aria-label="Scrollable leaderboard rows"
              onScroll={(event) =>
                setScrollTop(
                  event.currentTarget.scrollTop
                )
              }
              style={{
                height: viewportHeight,
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehavior: "contain",
              }}
            >
              {/* Spacer representing all logical rows */}
              <div
                style={{
                  height: totalHeight,
                  position: "relative",
                }}
              >
                {/* Render only the visible slice */}
                {renderedSquads.map((squad, index) => {
                  const actualIndex =
                    startIndex + index;

                  return (
                    <div
                      key={squad.squadId}
                      role="row"
                      aria-rowindex={
                        actualIndex + 2
                      }
                      data-virtual-row="true"
                      style={{
                        ...rowStyle,
                        position: "absolute",
                        top:
                          actualIndex *
                          ROW_HEIGHT,
                        left: 0,
                        background:
                          actualIndex % 2 === 0
                            ? "#1e293b"
                            : "#253247",
                      }}
                    >
                      <div
                        role="cell"
                        style={cellStyle}
                      >
                        {actualIndex + 1}
                      </div>

                      <div
                        role="rowheader"
                        style={{
                          ...cellStyle,
                          fontWeight: 600,
                        }}
                        title={squad.squadName}
                      >
                        {squad.squadName}
                      </div>

                      <div
                        role="cell"
                        style={cellStyle}
                      >
                        {squad.wwcdCount}
                      </div>

                      <div
                        role="cell"
                        style={cellStyle}
                      >
                        {squad.placementPts}
                      </div>

                      <div
                        role="cell"
                        style={cellStyle}
                      >
                        {squad.killPts}
                      </div>

                      <div
                        role="cell"
                        style={{
                          ...cellStyle,
                          color: "#fbbf24",
                          fontWeight: 800,
                        }}
                      >
                        {getTotal(squad)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {visibleSquads.length === 0 && (
          <p
            style={{
              padding: 20,
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            No squads found.
          </p>
        )}

        <p
          style={{
            marginTop: 15,
            color: "#94a3b8",
            fontSize: 12,
          }}
        >
          Virtual scrolling renders only visible
          rows plus overscan. Stress-test squad
          statistics are fictional.
        </p>
      </div>
    </section>
  );
}
