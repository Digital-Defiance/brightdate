import { FC } from "react";

const brightUnits = [
  {
    name: "1 Light-Milliday (Lmd)",
    definition: "$c \\times 86.4 \\text{ s}$",
    distance: "$25,902,068,371.2 \\text{ m}$",
    precision: "Absolute",
  },
  {
    name: "1 Light-Day (Ld)",
    definition: "$c \\times 86,400 \\text{ s}$",
    distance: "$25,902,068,371,200 \\text{ m}$",
    precision: "Absolute",
  },
  {
    name: "1 Light-Kiloday (Lkd)",
    definition: "$c \\times 86,400,000 \\text{ s}$",
    distance: "$25,902,068,371,200,000 \\text{ m}$",
    precision: "Absolute",
  },
];

const brightMeterUnits = [
  {
    name: "Micro-BrightMeter (μbm)",
    definition: "$c \\times 10^{-6}\\text{ s}$",
    lightTravelTime: "$1\\text{ Microsecond}$",
    context: "$\\approx 300\\text{ meters}$ (Human scale).",
  },
  {
    name: "Milli-BrightMeter (mbm)",
    definition: "$c \\times 10^{-3}\\text{ s}$",
    lightTravelTime: "$1\\text{ Millisecond}$",
    context: "$\\approx 300\\text{ kilometers}$ (Low Earth Orbit).",
  },
  {
    name: "BrightMeter (bm)",
    definition: "$c \\times 1\\text{ s}$",
    lightTravelTime: "$1\\text{ Second}$",
    context: "$\\approx 0.75 \\times$ Distance to the Moon.",
  },
  {
    name: "Mega-BrightMeter (Mbm)",
    definition: "$c \\times 10^6\\text{ s}$",
    lightTravelTime: "$\\approx 11.57 \\text{ days}$",
    context: "$\\approx 2 \\text{ AU}$ (Solar System Radius).",
  },
  {
    name: "Giga-BrightMeter (Gbm)",
    definition: "$c \\times 10^9\\text{ s}$",
    lightTravelTime: "$\\approx 31.68 \\text{ years}$",
    context: "$\\approx 10 \\text{ Parsecs}$ (Local Cluster).",
  },
];

export const BrightUnits: FC = () => {
  return (
    <>
      <table
        style={{ borderCollapse: "collapse", width: "100%", marginBottom: 32 }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              BrightUnit
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Formal Definition
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Exact Physical Distance
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Precision
            </th>
          </tr>
        </thead>
        <tbody>
          {brightUnits.map((unit) => (
            <tr key={unit.name}>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  fontWeight: "bold",
                }}
              >
                {unit.name}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {unit.definition}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {unit.distance}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  fontWeight: "bold",
                }}
              >
                {unit.precision}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Unit</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Definition
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Light-Travel Time
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Physical Context
            </th>
          </tr>
        </thead>
        <tbody>
          {brightMeterUnits.map((unit) => (
            <tr key={unit.name}>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  fontWeight: "bold",
                }}
              >
                {unit.name}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {unit.definition}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {unit.lightTravelTime}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {unit.context}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
