export const mock_failed_chart_data = {
  "conn_id": "b1ba61fd-2e78-4061-b3d2-75aee2c86dcb",
  "chartData": {
    "analysis": "The pie chart illustrates the distribution of company expenses across various categories. Salaries represent the largest portion at 40% of total expenses, indicating that labor costs are the primary financial commitment. Rent accounts for 10%, followed by Marketing (8.3%), Equipment (6.7%), Utilities (5%), Software (3.3%), and Other (3.3%). This distribution highlights that over half of the company's expenses are allocated to salaries, suggesting a labor-intensive business model. The relatively small proportion spent on software and other categories may indicate room for optimization in operational spending.",
    "chart_data": {
      "labels": [
        "Salaries",
        "Rent",
        "Utilities",
        "Marketing",
        "Equipment",
        "Software",
        "Other"
      ],
      "datasets": [
        {
          "type": "doughnut",
          "data": [
            120000,
            30000,
            15000,
            25000,
            20000,
            10000,
            10000
          ],
          "borderColor": [
            "rgb(224, 81, 81)",
            "rgb(224, 203, 81)",
            "rgb(122, 224, 81)",
            "rgb(81, 224, 163)",
            "rgb(81, 163, 224)",
            "rgb(122, 81, 224)",
            "rgb(224, 81, 204)"
          ],
          "backgroundColor": [
            "rgba(224, 81, 81, 0.8)",
            "rgba(224, 203, 81, 0.8)",
            "rgba(122, 224, 81, 0.8)",
            "rgba(81, 224, 163, 0.8)",
            "rgba(81, 163, 224, 0.8)",
            "rgba(122, 81, 224, 0.8)",
            "rgba(224, 81, 204, 0.8)"
          ],
          "borderWidth": 2
        }
      ]
    },
    "chart_title": "Company Expenses Distribution",
    "chart_opts": {
      "responsive": true,
      "maintainAspectRatio": false,
      "scales": {}
    }
  },
  "marker": "CHART_DATA"
}

export const mock_chart_data = {
  "conn_id": "acb047d0-b7eb-4973-834f-4994a7d9e0cf",
  "data": {
    "analysis": "The chart displays key economic indicators from 2016 to 2025, revealing several notable trends. Inflation (CPI) peaked in 2022 at 8.0%, reflecting significant price pressures, followed by a decline to 2.6% in 2025. Real GDP Growth shows a strong rebound in 2021 (6.1%) post-pandemic, but has since moderated to 2.5% in 2025, indicating a slowdown in economic expansion. Nominal GDP steadily increased from $18.8T in 2016 to $28.9T in 2025, reflecting overall economic growth in nominal terms. Unemployment declined from 4.9% in 2016 to a low of 3.6% in 2022 and 2023, but rose slightly to 4.0% in 2025, suggesting a slight tightening in labor markets. Consumer Confidence reached its peak in 2019 at 108 (index base 1985=100), then dropped sharply during 2020 due to the pandemic (85), rebounded in 2021 (95), and stabilized around 100–110 in 2023–2025. Labor Force Participation remained relatively stable, hovering around 62–63%, with minor fluctuations. Household Debt grew consistently from $12.5T in 2016 to $16.8T in 2025, indicating rising consumer leverage. Interest Rates rose sharply from 0.5% in 2020 to 4.0% in 2024, reflecting monetary tightening to combat inflation, though they slightly declined to 3.75% in 2025. Manufacturing PMI fluctuated around 50–55, with a notable drop in 2020 (47.5), indicating contraction, and recovery in 2021–2023, though it dipped slightly in 2025. Overall, the data suggests a period of post-pandemic recovery, followed by inflationary pressures and monetary tightening, with economic indicators stabilizing in the latter years.",
    "chart_data": {
      "labels": [
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025"
      ],
      "datasets": [
        {
          "type": "line",
          "label": "Inflation CPI (%)",
          "data": [
            1.3,
            2.1,
            2.4,
            1.8,
            1.2,
            4.7,
            8,
            4.1,
            2.9,
            2.6
          ],
          "borderColor": "rgb(224, 81, 81)",
          "backgroundColor": "rgba(224, 81, 81, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Real GDP Growth (%)",
          "data": [
            1.8,
            2.4,
            3,
            2.6,
            -2.2,
            6.1,
            2.5,
            2.9,
            1.7,
            2.5
          ],
          "borderColor": "rgb(224, 176, 81)",
          "backgroundColor": "rgba(224, 176, 81, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Nominal GDP (USD Trillions)",
          "data": [
            18.8,
            19.6,
            20.7,
            21.5,
            21.4,
            23.7,
            26,
            27.7,
            28.2,
            28.9
          ],
          "borderColor": "rgb(176, 224, 81)",
          "backgroundColor": "rgba(176, 224, 81, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Unemployment (%)",
          "data": [
            4.9,
            4.4,
            3.9,
            3.7,
            8.1,
            5.4,
            3.6,
            3.6,
            4.1,
            4
          ],
          "borderColor": "rgb(81, 224, 81)",
          "backgroundColor": "rgba(81, 224, 81, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Consumer Confidence (Index)",
          "data": [
            98,
            101,
            107,
            108,
            85,
            95,
            98,
            102,
            110,
            93
          ],
          "borderColor": "rgb(81, 224, 176)",
          "backgroundColor": "rgba(81, 224, 176, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Labor Force Participation (%)",
          "data": [
            62.9,
            63,
            63.1,
            63.2,
            61.5,
            61.7,
            62.1,
            62.3,
            62.5,
            62.2
          ],
          "borderColor": "rgb(81, 176, 224)",
          "backgroundColor": "rgba(81, 176, 224, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Household Debt (USD Trillions)",
          "data": [
            12.5,
            12.9,
            13.3,
            13.7,
            14.1,
            14.8,
            15.2,
            15.6,
            16.1,
            16.8
          ],
          "borderColor": "rgb(81, 81, 224)",
          "backgroundColor": "rgba(81, 81, 224, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Interest Rate (%)",
          "data": [
            0.75,
            1.25,
            2.25,
            2.5,
            0.5,
            0.75,
            2,
            3.5,
            4,
            3.75
          ],
          "borderColor": "rgb(176, 81, 224)",
          "backgroundColor": "rgba(176, 81, 224, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        },
        {
          "type": "line",
          "label": "Manufacturing PMI (Index)",
          "data": [
            51.7,
            52.3,
            55,
            54.2,
            47.5,
            50.1,
            51.3,
            52,
            51.5,
            50.7
          ],
          "borderColor": "rgb(224, 81, 176)",
          "backgroundColor": "rgba(224, 81, 176, 0.1)",
          "fill": true,
          "tension": 0.4,
          "borderWidth": 2,
          "pointRadius": 2,
          "yAxisID": "y"
        }
      ]
    },
    "chart_title": "Economic Indicators Over Time (2016-2025)",
    "chart_opts": {
      "responsive": true,
      "maintainAspectRatio": false,
      "scales": {
        "y": {
          "axis": "y",
          "display": true,
          "type": "linear",
          "position": "left",
          "title": {
            "display": true,
            "text": "Value",
            "font": {
              "weight": "bold"
            },
            "padding": {
              "top": 4,
              "bottom": 4
            },
            "color": "#666"
          },
          "grid": {
            "color": "rgba(200, 200, 200, 0.2)",
            "display": true,
            "lineWidth": 1,
            "drawOnChartArea": true,
            "drawTicks": true,
            "tickLength": 8,
            "offset": false
          },
          "ticks": {
            "minRotation": 0,
            "maxRotation": 50,
            "mirror": false,
            "textStrokeWidth": 0,
            "textStrokeColor": "",
            "padding": 3,
            "display": true,
            "autoSkip": true,
            "autoSkipPadding": 3,
            "labelOffset": 0,
            "minor": {},
            "major": {},
            "align": "center",
            "crossAlign": "near",
            "showLabelBackdrop": false,
            "backdropColor": "rgba(255, 255, 255, 0.75)",
            "backdropPadding": 2,
            "color": "#666"
          },
          "offset": false,
          "reverse": false,
          "beginAtZero": false,
          "bounds": "ticks",
          "clip": true,
          "grace": 0,
          "border": {
            "display": true,
            "dash": [],
            "dashOffset": 0,
            "width": 1,
            "color": "rgba(0,0,0,0.1)"
          },
          "id": "y"
        },
        "x": {
          "axis": "x",
          "display": true,
          "type": "category",
          "position": "bottom",
          "title": {
            "display": true,
            "text": "Year",
            "font": {
              "weight": "bold"
            },
            "padding": {
              "top": 4,
              "bottom": 4
            },
            "color": "#666"
          },
          "grid": {
            "display": false,
            "lineWidth": 1,
            "drawOnChartArea": true,
            "drawTicks": true,
            "tickLength": 8,
            "offset": false,
            "color": "rgba(0,0,0,0.1)"
          },
          "ticks": {
            "minRotation": 0,
            "maxRotation": 50,
            "mirror": false,
            "textStrokeWidth": 0,
            "textStrokeColor": "",
            "padding": 3,
            "display": true,
            "autoSkip": true,
            "autoSkipPadding": 3,
            "labelOffset": 0,
            "minor": {},
            "major": {},
            "align": "center",
            "crossAlign": "near",
            "showLabelBackdrop": false,
            "backdropColor": "rgba(255, 255, 255, 0.75)",
            "backdropPadding": 2,
            "color": "#666"
          },
          "offset": false,
          "reverse": false,
          "beginAtZero": false,
          "bounds": "ticks",
          "clip": true,
          "grace": 0,
          "border": {
            "display": true,
            "dash": [],
            "dashOffset": 0,
            "width": 1,
            "color": "rgba(0,0,0,0.1)"
          },
          "id": "x"
        }
      },
      "plugins": {}
    }
  },
  "marker": "CHART_DATA"
}
