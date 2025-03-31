# app_geometric.py

from shiny import App, ui, reactive, render
from shinywidgets import output_widget, render_widget
import plotly.graph_objects as go
import numpy as np
from scipy.stats import geom
import pandas as pd

app_ui = ui.page_fluid(
    ui.page_navbar(
        ui.nav_panel("Explore Geometric Distribution",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.panel_conditional(
                        "!input.use_text_input",
                        ui.input_slider("max_trials", "Maximum Trials to Show", min=5, max=100, value=20, step=1),
                        ui.input_slider("p_slider", "Probability of Success (p)", min=0.01, max=1, value=0.3, step=0.01)
                    ),
                    ui.panel_conditional(
                        "input.use_text_input",
                        ui.input_numeric("max_trials_text", "Maximum Trials to Show", value=20, min=1, max=100),
                        ui.input_numeric("p_text", "Probability of Success (p)", value=0.3, min=0.01, max=1, step=0.01)
                    ),
                    ui.input_checkbox("use_text_input", "Enter numbers for trials and p", value=False),
                    ui.tags.h4("Probability Table:"),
                    ui.output_ui("geom_table"),
                    width=500
                ),
                output_widget("geom_plot", height="500px")
            )
        )
    )
)

def server(input, output, session):

    @reactive.Calc
    def params():
        max_trials = input.max_trials_text() if input.use_text_input() else input.max_trials()
        p = input.p_text() if input.use_text_input() else input.p_slider()
        return int(max_trials), float(p)

    @output
    @render_widget
    def geom_plot():
        max_trials, p = params()
        x = np.arange(1, max_trials+1)
        y = geom.pmf(x, p)

        fig = go.Figure()

        fig.add_trace(go.Bar(
            selectedpoints=[-1],
            selected=dict(marker=dict(color='#FF9B3C')),
            unselected=dict(marker=dict(color='rgba(100, 189, 255, 0.8)')),
            x=x,
            y=y,
            width=[0.6] * len(x),
            marker=dict(color='rgba(100, 189, 255, 0.8)'),
            hovertemplate='x = %{x}<br>P(X=%{x}) = %{y:.4f}<extra></extra>',
            hoverlabel=dict(bgcolor='#FF9B3C', font_size=14),
            name='Geometric PMF'
        ))

        fig.update_layout(
            title=f"Geometric Distribution (p={p})",
            xaxis_title="Trial of First Success (x)",
            yaxis_title="Probability",
            margin=dict(l=40, r=40, t=40, b=40),
            hovermode='closest',
            clickmode='event+select'
        )
        return fig

    @output
    @render.ui
    def geom_table():
        max_trials, p = params()
        x_vals = np.arange(1, max_trials+1)
        probs = geom.pmf(x_vals, p)

        rows = "\n".join(
            f"<tr data-x='{x}'><td align='center'>{x}</td><td align='center'>{prob:.5f}</td></tr>"
            for x, prob in zip(x_vals, probs)
        )

        html = f"""
        <table class='table shiny-table table-hover spacing-s' style='width:auto;'>
        <thead>
            <tr>
                <th style='text-align: center;'>x</th>
                <th style='text-align: center;'>P(X=x)</th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
        </table>
        """
        return ui.HTML(html)

    ui.tags.script("""
    document.addEventListener("shiny:value", function (e) {
        if (e.name === "geom_table") {
            const tbls = document.querySelectorAll("table.shiny-table");
            tbls.forEach((tbl) => {
                if (!tbl.id) tbl.id = "geom_table";
            });
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        let lockedIndex = null;

        function clearHighlights() {
            const table = document.getElementById("geom_table");
            if (!table) return;
            [...table.querySelectorAll("tbody tr")].forEach(row => row.style.backgroundColor = "");
        }

        function highlightRow(xval) {
            const table = document.getElementById("geom_table");
            if (!table || xval === undefined) return;
            const row = table.querySelector(`tr[data-x='${xval}']`);
            if (row) row.style.backgroundColor = "#FF9B3C55";
        }

        document.addEventListener("plotly_hover", function (e) {
            if (lockedIndex !== null) return;
            const plot = e.target;
            const pt = e.detail.points[0];
            Plotly.restyle(plot, {selectedpoints: [pt.pointIndex]}, [0]);
            highlightRow(pt.x);
        });

        document.addEventListener("plotly_unhover", function (e) {
            if (lockedIndex !== null) return;
            const plot = e.target;
            Plotly.restyle(plot, {selectedpoints: [-1]}, [0]);
            clearHighlights();
        });

        document.addEventListener("plotly_click", function (e) {
            const plot = e.target;
            const pt = e.detail.points[0];
            lockedIndex = pt.pointIndex;
            Plotly.restyle(plot, {selectedpoints: [pt.pointIndex]}, [0]);
            highlightRow(pt.x);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                lockedIndex = null;
                const plot = document.querySelector(".js-plotly-plot");
                if (plot) Plotly.restyle(plot, {selectedpoints: [-1]}, [0]);
                clearHighlights();
            }
        });
    });
    """)

app = App(app_ui, server)
