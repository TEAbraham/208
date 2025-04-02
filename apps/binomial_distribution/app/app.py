# app.py

from shiny import App, ui, reactive, render
from shinywidgets import output_widget, render_widget
import plotly.graph_objects as go
import numpy as np
from scipy.stats import binom, norm
import pandas as pd

# UI Definition
app_ui = ui.page_fluid(
    ui.panel_title("The Binomial Distribution"),
    ui.navset_tab(
        ui.nav_panel("Explore Distribution",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_slider("n_slider", "Number of Bernoulli Trials (n)", min=1, max=100, value=6, step=1),
                    ui.input_slider("p_slider", "Probability of Success (p)", min=0, max=1, value=0.5, step=0.01),
                    ui.input_checkbox("use_inputs", "Enter numbers for n and p", value=False),
                    ui.panel_conditional(
                        "input.use_inputs",
                        ui.input_numeric("n_text", "n", value=6, step=1, min=1, max=100),
                        ui.input_numeric("p_text", "p", value=0.5, min=0, max=1, step=0.01),
                    ),
                    ui.input_checkbox("overlay_normal", "Overlay Normal Distribution", value=False),
                    width=500
                ),
                    ui.tags.p("The binomial distribution models the number of successes in a fixed number of independent Bernoulli trials. The shape and center depend on the number of trials n and the probability of success p. Explore how the shape changes below."),
                    output_widget("dist_plot", height="500px"),
                    ui.tags.p("The orange bars represent the binomial probabilities for each number of successes. If selected, the gray line represents the normal approximation."),
                    ui.tags.h4("Probability Table:"),
                    ui.output_ui("prob_table")
            )
        ),
        ui.nav_panel("Find Probability",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_numeric("prob_n", "Number of Trials (n)", value=10, min=1, max=100, step=1),
                    ui.input_numeric("prob_p", "Probability of Success (p)", value=0.5, min=0, max=1, step=0.01),
                    ui.input_select("prob_type", "Type of Probability", choices=[
                        "Binomial Probability: P(X = x)",
                        "Lower Tail: P(X < x)",
                        "Upper Tail: P(X > x)",
                        "Interval: P(x₁ < X < x₂)"
                    ]),
                    ui.panel_conditional(
                        "!input.prob_type.includes('Interval')",
                        ui.input_numeric("x1_prob", "Value of x:", value=5, step=1)
                    ),
                    ui.panel_conditional(
                        "input.prob_type.includes('Interval')",
                        ui.input_numeric("x1_prob", "x₁:", value=5, step=1),
                        ui.input_numeric("x2_prob", "x₂:", value=7, step=1)
                ),
                    width=500),
                    output_widget("prob_plot", height="500px"),
                    ui.output_ui("prob_summary")
                )
            ),
        ui.nav_panel("Find Percentile",
            ui.layout_sidebar(
                ui.sidebar(
                    ui.input_numeric("perc_n", "Number of Trials (n)", value=10, min=1, max=100, step=1),
                    ui.input_numeric("perc_p", "Probability of Success (p)", value=0.5, min=0, max=1, step=0.01),
                    ui.input_select("perc_type", "Type of Percentile", choices=[
                        "Lower Tail: P(X < x)",
                        "Upper Tail: P(X > x)",
                        "Middle Interval: P(x₁ < X < x₂)"
                    ]),
                    ui.input_numeric("perc_prob", "Probability (%)", value=95, min=0, max=100, step=0.1),
                    width=500
                ),
                    output_widget("perc_plot", height="500px"),
                    ui.output_ui("perc_summary")
            )
        )
    )
)

# Server Logic
def server(input, output, session):

    @reactive.Calc
    def get_params():
        n = input.n_text() if input.use_inputs() else input.n_slider()
        p = input.p_text() if input.use_inputs() else input.p_slider()
        return int(n), float(p)

    @output
    @render_widget
    def dist_plot():
        n, p = get_params()
        x = np.arange(0, n + 1)
        y = binom.pmf(x, n, p)

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=x,
            y=y,
            marker_color="#FF9B3C",
            name="Binomial P(X = x)",
            hovertemplate="x = %{x}<br>P(X = %{x}) = %{y:.4f}<extra></extra>",
        ))

        if input.overlay_normal():
            mu, sigma = n * p, np.sqrt(n * p * (1 - p))
            x_cont = np.linspace(0, n, 500)
            y_norm = norm.pdf(x_cont, mu, sigma)
            fig.add_trace(go.Scatter(x=x_cont, y=y_norm, mode='lines', name="Normal Approximation", line=dict(color="gray")))

        fig.update_layout(
            title=f"Binomial Distribution (n={n}, p={p})",
            xaxis_title="x",
            yaxis_title="P(X = x)",
            margin=dict(l=40, r=40, t=40, b=40)
        )
        return fig

    @output
    @render.ui
    def prob_table():
        n, p = get_params()
        x_vals = np.arange(0, n + 1)
        probs = binom.pmf(x_vals, n, p)

        rows = "\n".join(
            f"<tr><td align='center'>{x}</td><td align='center'>{prob:.5f}</td></tr>"
            for x, prob in zip(x_vals, probs)
        )

        html = f"""
        <table class='table shiny-table table-hover spacing-s' style='width:auto;'>
        <thead>
            <tr>
                <th style='text-align: center;'>x</th>
                <th style='text-align: center;'>P(X = x)</th>
            </tr>
        </thead>
        <tbody>{rows}</tbody>
        </table>
        """
        return ui.HTML(html)

    @output
    @render_widget
    def prob_plot():
        n, p = input.prob_n(), input.prob_p()
        x = np.arange(0, n + 1)
        y = binom.pmf(x, n, p)

        prob_type = input.prob_type()

        x1 = input.x1_prob()
        x2 = input.x2_prob() if hasattr(input, 'x2_prob') else None


        fig = go.Figure()
        fig.add_trace(go.Bar(x=x, y=y, marker_color="#eee", hoverinfo='x+y'))

        highlight = np.zeros_like(y)
        if "Binomial Probability" in prob_type:
            if 0 <= x1 <= n:
                highlight[int(x1)] = y[int(x1)]
                result = y[int(x1)]
        elif "Lower" in prob_type:
            mask = x < x1
            highlight[mask] = y[mask]
            result = np.sum(y[mask])
        elif "Upper" in prob_type:
            mask = x > x1
            highlight[mask] = y[mask]
            result = np.sum(y[mask])
        elif "Interval" in prob_type:
            mask = (x > x1) & (x < x2)
            highlight[mask] = y[mask]
            result = np.sum(y[mask])

        fig.add_trace(go.Bar(
            x=x,
            y=highlight,
            marker_color="#FF9B3C",
            hovertemplate="x = %{x}<br>P(X = %{x}) = %{y:.4f}<extra></extra>",
            name="Highlighted"
        ))

        fig.update_layout(
            title="Binomial Probability Visualization",
            xaxis_title="x",
            yaxis_title="P(X = x)",
            showlegend=False
        )
        return fig

    @output
    @render.ui
    def prob_summary():
        n, p = input.prob_n(), input.prob_p()
        x1 = input.x1_prob()
        x2 = input.x2_prob() if hasattr(input, 'x2_prob') else None
        prob_type = input.prob_type()

        if "Binomial Probability" in prob_type:
            result = binom.pmf(x1, n, p)
            msg = f"P(X = {x1}) = {result:.4f}"
        elif "Lower" in prob_type:
            result = binom.cdf(x1 - 1, n, p)
            msg = f"P(X < {x1}) = {result:.4f}"
        elif "Upper" in prob_type:
            result = 1 - binom.cdf(x1, n, p)
            msg = f"P(X > {x1}) = {result:.4f}"
        elif "Interval" in prob_type:
            result = binom.cdf(x2 - 1, n, p) - binom.cdf(x1, n, p)
            msg = f"P({x1} < X < {x2}) = {result:.4f}"
        else:
            msg = "Invalid selection."

        return ui.tags.p(msg)

    @output
    @render_widget
    def perc_plot():
        n, p = input.perc_n(), input.perc_p()
        prob = input.perc_prob() / 100
        perc_type = input.perc_type()

        x = np.arange(0, n + 1)
        y = binom.pmf(x, n, p)

        fig = go.Figure()
        fig.add_trace(go.Bar(x=x, y=y, marker_color="#eee"))

        if "Lower" in perc_type:
            x_val = np.argmax(binom.cdf(x, n, p) >= prob)
            bar_colors = ["#FF9B3C" if i <= x_val else "#eee" for i in x]
        elif "Upper" in perc_type:
            x_val = np.argmax(binom.cdf(x, n, p) >= 1 - prob)
            bar_colors = ["#FF9B3C" if i >= x_val else "#eee" for i in x]
        elif "Middle" in perc_type:
            low_tail = (1 - prob) / 2
            low_x = np.argmax(binom.cdf(x, n, p) >= low_tail)
            high_x = np.argmax(binom.cdf(x, n, p) >= 1 - low_tail)
            bar_colors = ["#FF9B3C" if low_x <= i <= high_x else "#eee" for i in x]
        else:
            bar_colors = ["#eee"] * len(x)

        fig.data[0].marker.color = bar_colors
        fig.update_layout(
            title="Percentile Range Highlight",
            xaxis_title="x",
            yaxis_title="P(X = x)",
            showlegend=False
        )
        return fig

    @output
    @render.ui
    def perc_summary():
        n, p = input.perc_n(), input.perc_p()
        prob = input.perc_prob() / 100
        perc_type = input.perc_type()
        x = np.arange(0, n + 1)

        if "Lower" in perc_type:
            val = np.argmax(binom.cdf(x, n, p) >= prob)
            msg = f"x such that P(X < x) ≈ {prob:.2%} is x = {val}"
        elif "Upper" in perc_type:
            val = np.argmax(binom.cdf(x, n, p) >= 1 - prob)
            msg = f"x such that P(X > x) ≈ {prob:.2%} is x = {val}"
        elif "Middle" in perc_type:
            low_tail = (1 - prob) / 2
            low = np.argmax(binom.cdf(x, n, p) >= low_tail)
            high = np.argmax(binom.cdf(x, n, p) >= 1 - low_tail)
            msg = f"x values such that P(x₁ < X < x₂) ≈ {prob:.2%} are x ∈ [{low}, {high}]"
        else:
            msg = "Invalid input."

        return ui.tags.p(msg)


app = App(app_ui, server)
