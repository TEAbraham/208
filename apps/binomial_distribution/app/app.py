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
                    ui.output_table("prob_table")
                ),
                output_widget("binom_plot", height="600px")
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

        marker_offset = 0.02

        def offset_signal(signal_val):
            if abs(signal_val) <= marker_offset:
                return 0
            return signal_val - marker_offset if signal_val > 0 else signal_val + marker_offset

        fig = go.Figure()

        # Add vertical lines for lollipops
        for i in range(len(x)):
            fig.add_shape(
                type="line",
                x0=x[i], y0=0,
                x1=x[i], y1=offset_signal(y[i]),
                line=dict(color='red', width=1)
            )

        # Add markers for lollipop heads
        fig.add_trace(go.Scatter(
            x=x,
            y=y,
            mode='markers',
            marker=dict(size=8, color='red'),
            name='Binomial PMF'
        ))

        # Optional normal overlay
        if input.overlay_normal():
            x_cont = np.linspace(0, n, 500)
            mu, sigma = n*p, np.sqrt(n*p*(1-p))
            normal_curve = norm.pdf(x_cont, mu, sigma)
            fig.add_trace(go.Scatter(x=x_cont, y=normal_curve, mode='lines', name='Normal Distribution', line=dict(color='gray')))

        fig.update_layout(
            title=f"Binomial Distribution (n={n}, p={p})",
            xaxis_title="Number of Successes (x)",
            yaxis_title="Probability",
            margin=dict(l=40, r=40, t=40, b=40)
        )
        return fig

    @output
    @render.table
    def prob_table():
        n, p = params()
        x_vals = np.arange(1, n+1)
        probs = binom.pmf(x_vals, n, p)
        df = pd.DataFrame({"x": x_vals, "P(X=x)": np.round(probs, 5)})
        return df

app = App(app_ui, server)
