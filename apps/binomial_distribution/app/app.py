# app.py

from shiny import App, ui, reactive, render
from shinywidgets import output_widget, render_widget
import plotly.graph_objects as go
import numpy as np
from scipy.stats import binom, norm
import pandas as pd

# UI Definition
app_ui = ui.page_fluid(
    ui.page_navbar(
        ui.nav_panel("Explore",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.panel_conditional(
                        "!input.use_text_input",
                        ui.input_slider("n_slider", "Number of Bernoulli Trials (n)", min=1, max=100, value=6, step=1),
                        ui.input_slider("p_slider", "Probability of Success (p)", min=0, max=1, value=0.5, step=0.01)
                    ),
                    ui.panel_conditional(
                        "input.use_text_input",
                        ui.input_numeric("n_text", "Number of Bernoulli Trials (n)", value=6, min=1, max=100),
                        ui.input_numeric("p_text", "Probability of Success (p)", value=0.5, min=0, max=1, step=0.01)
                    ),
                    ui.input_checkbox("use_text_input", "Enter numbers for n and p", value=False),
                    ui.input_checkbox("overlay_normal", "Overlay Normal Distribution", value=False),
                    ui.tags.h4("Probability Table:"),
                    ui.output_table("prob_table"),
                    width=500
                ),
                output_widget("binom_plot", height="500px")
            )
        )
    )
)

# Server Logic
def server(input, output, session):

    @reactive.Calc
    def params():
        n = input.n_text() if input.use_text_input() else input.n_slider()
        p = input.p_text() if input.use_text_input() else input.p_slider()
        return int(n), float(p)

    @output
    @render_widget
    def binom_plot():
        n, p = params()
        x = np.arange(0, n+1)
        y = binom.pmf(x, n, p)

        fig = go.Figure()

        bar_width = 0.6

        # Use bar chart instead of shapes for interactivity
        fig.add_trace(go.Bar(
            selectedpoints=[-1],
            selected=dict(marker=dict(color='#FF9B3C')),
            unselected=dict(marker=dict(color='rgba(100, 189, 255, 0.8)')),
            x=x,
            y=y,
            width=[bar_width] * len(x),
            marker=dict(color='rgba(100, 189, 255, 0.8)'),
            hovertemplate='x = %{x}<br>P(X=%{x}) = %{y:.4f}<extra></extra>', hoverlabel=dict(bgcolor='#FF9B3C', font_size=14),
            name='Binomial PMF'
        ))

        if input.overlay_normal():
            x_cont = np.linspace(0, n, 500)
            mu, sigma = n*p, np.sqrt(n*p*(1-p))
            normal_curve = norm.pdf(x_cont, mu, sigma)
            fig.add_trace(go.Scatter(x=x_cont, y=normal_curve, mode='lines', name='Normal Distribution', line=dict(color='gray')))

        fig.update_layout(
            title=f"Binomial Distribution (n={n}, p={p})",
            xaxis_title="Number of Successes (x)",
            yaxis_title="Probability",
            margin=dict(l=40, r=40, t=40, b=40),
            clickmode='event+select'
            hovermode='closest'
        )
        return fig

    @output
    @render.ui
    def prob_table():
        n, p = params()
        x_vals = np.arange(0, n+1)
        probs = binom.pmf(x_vals, n, p)

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
        if (e.name === "prob_table") {
            const tbls = document.querySelectorAll("table.shiny-table");
            tbls.forEach((tbl) => {
                if (!tbl.id) tbl.id = "prob_table";
            });
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        let lockedIndex = null;

        function clearHighlights() {
            const table = document.getElementById("prob_table");
            if (!table) return;
            [...table.querySelectorAll("tbody tr")].forEach(row => row.style.backgroundColor = "");
        }

        function highlightRow(xval) {
            const table = document.getElementById("prob_table");
            if (!table || xval === undefined) return;
            const row = table.querySelector(`tr[data-x='${xval}']`);
            if (row) row.style.backgroundColor = "#FF9B3C55";
        }
            }
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
            const rows = table.querySelectorAll("tbody tr");
            for (let row of rows) {
                const cell = row.cells[0];
                if (parseInt(cell.textContent.trim()) === xval) {
                    row.style.backgroundColor = "#FF9B3C55";
                    break;
                }
            }
        });

        document.addEventListener("plotly_unhover", function (e) {
            const plot = e.target;
            Plotly.restyle(plot, {selectedpoints: [-1]}, [0]);
            clearHighlights();
        });
    });
"""),

app = App(app_ui, server)
